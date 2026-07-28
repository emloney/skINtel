// Supabase Edge Function: summarize-analysis
// Powers both the opening summary AND the follow-up chat for a product's
// ingredient analysis, using the Google Gemini API.
//
// The Gemini API key is read from the GEMINI_API_KEY secret and never leaves
// the server. Deploy from the Supabase dashboard (Edge Functions → create) or
// with: supabase functions deploy summarize-analysis
//
// Set the secret first:
//   Dashboard → Edge Functions → Manage secrets → GEMINI_API_KEY
//   (or) supabase secrets set GEMINI_API_KEY=your_key_here
//
// Request body:
//   { productName, result, profile, messages? }
//   - messages omitted/empty → returns the opening summary
//   - messages present        → returns the next chat reply, with context
// Response: { reply: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Gemini's free tier. Change here if you switch models.
const MODEL = 'gemini-2.0-flash';

interface Flag {
  matched: string;
  riskLevel: string;
  concern?: string | null;
}
interface AnalysisResult {
  score: number;
  band: string;
  totalIngredients: number;
  flags: Flag[];
  banned: { matched: string; reason?: string | null }[];
  beneficial: { matched: string; benefit?: string | null }[];
}
interface UserProfile {
  skinType?: string | null;
  skinConcerns?: string[] | null;
  isPregnant?: boolean | null;
}
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// The persona + rules + the full analysis context. Sent as Gemini's
// systemInstruction so it stays in force across every turn of the chat.
function buildSystemInstruction(
  productName: string,
  result: AnalysisResult,
  profile: UserProfile
): string {
  const flags = result.flags
    .map((f) => `- ${f.matched} (${f.riskLevel} risk)${f.concern ? `: ${f.concern}` : ''}`)
    .join('\n');
  const banned = result.banned.map((b) => `- ${b.matched}${b.reason ? `: ${b.reason}` : ''}`).join('\n');
  const good = result.beneficial.map((b) => `- ${b.matched}`).join('\n');

  return `You are SkinTel, a warm, trustworthy skincare assistant chatting with a user
about one specific product they analyzed. Keep replies short and conversational (2 to 4
sentences), in plain language a beginner with no chemistry background can follow.

Rules:
- Base every answer on the analysis data below and general, well-established skincare knowledge.
- Do NOT invent ingredients, numbers, or claims about THIS product beyond what's given.
- Do NOT give medical diagnoses or health promises. You may suggest patch-testing or seeing a
  dermatologist for specific concerns.
- Consider the user's skin type, concerns, and pregnancy status when relevant.
- If asked something unrelated to skincare, gently steer back to the product.
- Be encouraging and honest — don't overstate danger, don't downplay real flags.

── Analysis of "${productName}" ──
Safety score: ${result.score}/100 (${result.band})
Total ingredients: ${result.totalIngredients}

User skin type: ${profile.skinType || 'unknown'}
User skin concerns: ${(profile.skinConcerns || []).join(', ') || 'none listed'}
User pregnant: ${profile.isPregnant ? 'yes' : 'no'}

Flagged ingredients:
${flags || 'none'}

Restricted/banned ingredients:
${banned || 'none'}

Skin-friendly ingredients:
${good || 'none'}`;
}

// Gemini requires `contents` to start with a user turn and alternate
// user/model. Our stored conversation starts with the assistant summary, so we
// prepend a synthetic user turn to keep the sequence valid.
function buildContents(messages: ChatMessage[]) {
  const seed = {
    role: 'user',
    parts: [{ text: 'Give me a short, friendly summary of this product’s analysis.' }],
  };
  const mapped = (messages || []).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  if (mapped.length === 0) return [seed];
  if (mapped[0].role === 'model') return [seed, ...mapped];
  return mapped;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY secret is not set on this function.');
    }

    const { productName, result, profile, messages } = await req.json();
    if (!result || typeof result.score !== 'number') {
      throw new Error('Missing or invalid analysis result in request body.');
    }

    const systemInstruction = buildSystemInstruction(
      productName ?? 'this product',
      result,
      profile ?? {}
    );
    const contents = buildContents(messages ?? []);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      throw new Error(`Gemini API error ${geminiRes.status}: ${detail.slice(0, 300)}`);
    }

    const data = await geminiRes.json();
    const reply: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!reply) {
      throw new Error('Gemini returned an empty response.');
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
