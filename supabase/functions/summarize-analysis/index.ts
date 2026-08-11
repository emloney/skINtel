// Supabase Edge Function: summarize-analysis
// Powers both the opening summary AND the follow-up chat for a product's
// ingredient analysis, using the Groq API (OpenAI-compatible, generous free tier).
//
// The Groq API key is read from the GROQ_API_KEY secret and never leaves the
// server. Deploy from the Supabase dashboard (Edge Functions → the existing
// summarize-analysis function → Code → paste → Deploy) or with:
//   supabase functions deploy summarize-analysis
//
// Set the secret first (get a free key at https://console.groq.com/keys):
//   Dashboard → Edge Functions → Secrets → GROQ_API_KEY
//   (or) supabase secrets set GROQ_API_KEY=your_key_here
//
// Request body:  { productName, result, profile, messages? }
//   - messages omitted/empty → returns the opening summary
//   - messages present        → returns the next chat reply, with context
// Response: { reply: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Groq's free tier. Change here if you switch models.
// Other options: 'llama-3.1-8b-instant' (faster), 'gemma2-9b-it'.
const MODEL = 'llama-3.3-70b-versatile';

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

// The persona + rules + the full analysis context, sent as the system message
// so it stays in force across every turn of the chat.
function buildSystemPrompt(
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

// Build the OpenAI-style message array: system prompt, then the conversation.
// The stored conversation starts with the assistant summary, so for an empty
// conversation we seed a user request; otherwise we pass turns through as-is.
function buildMessages(systemPrompt: string, messages: ChatMessage[]) {
  const out: { role: string; content: string }[] = [{ role: 'system', content: systemPrompt }];
  if (!messages || messages.length === 0) {
    out.push({ role: 'user', content: "Give me a short, friendly summary of this product's analysis." });
    return out;
  }
  // Keep it well-formed: if the first turn is the assistant summary, precede it
  // with a synthetic user request.
  if (messages[0].role === 'assistant') {
    out.push({ role: 'user', content: "Summarize this product's analysis." });
  }
  for (const m of messages) out.push({ role: m.role, content: m.content });
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY secret is not set on this function.');
    }

    const { productName, result, profile, messages } = await req.json();
    if (!result || typeof result.score !== 'number') {
      throw new Error('Missing or invalid analysis result in request body.');
    }

    const systemPrompt = buildSystemPrompt(productName ?? 'this product', result, profile ?? {});
    const chatMessages = buildMessages(systemPrompt, messages ?? []);

    const payload = JSON.stringify({
      model: MODEL,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 300,
    });

    // Groq's free tier is generous, but retry a couple of times on 429 just in case.
    const backoffMs = [0, 2000, 4000];
    let groqRes: Response | null = null;
    for (let attempt = 0; attempt < backoffMs.length; attempt++) {
      if (backoffMs[attempt] > 0) await new Promise((r) => setTimeout(r, backoffMs[attempt]));
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: payload,
      });
      if (groqRes.status !== 429) break;
    }

    if (!groqRes || !groqRes.ok) {
      const detail = groqRes ? await groqRes.text() : 'no response';
      const status = groqRes ? groqRes.status : 0;
      if (status === 429) {
        throw new Error('Rate limit reached. Please wait a moment and try again.');
      }
      throw new Error(`Groq API error ${status}: ${detail.slice(0, 300)}`);
    }

    const data = await groqRes.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() ?? '';

    if (!reply) {
      throw new Error('The model returned an empty response.');
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
