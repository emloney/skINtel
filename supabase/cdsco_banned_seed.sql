-- ============================================================================
-- Starter data for cdsco_banned
-- Run this in Supabase Dashboard → SQL Editor
--
-- A curated set of substances that are banned or restricted in cosmetics in
-- India (Drugs & Cosmetics Act / Rules and BIS IS 4707). This is a STARTER set
-- for the app's "restricted ingredient" safety tier — verify and expand against
-- the latest CDSCO notifications and BIS IS 4707 before relying on it in
-- production. effective_date / source_url are left NULL rather than guessed.
--
-- Safe to re-run: a unique index + ON CONFLICT means duplicates are skipped.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS cdsco_banned_name_uidx
  ON public.cdsco_banned (lower(ingredient_name));

INSERT INTO public.cdsco_banned (ingredient_name, aliases, india_status, reason) VALUES
  ('Mercury',
   ARRAY['Mercurous chloride', 'Mercuric chloride', 'Ammoniated mercury', 'Calomel', 'Mercury compounds'],
   'banned',
   'Banned in cosmetics in India. A toxic heavy metal linked to kidney and nervous-system damage; commonly found in illegal skin-lightening creams.'),

  ('Hydroquinone',
   ARRAY['Quinol', 'Benzene-1,4-diol', '1,4-Dihydroxybenzene'],
   'restricted',
   'Not permitted in over-the-counter cosmetics in India (prescription-only for skin). Long-term use can cause ochronosis (permanent skin darkening).'),

  ('Lead acetate',
   ARRAY['Lead(II) acetate', 'Sugar of lead'],
   'banned',
   'Banned as a cosmetic colorant/ingredient. Lead is neurotoxic and accumulates in the body.'),

  ('Clobetasol propionate',
   ARRAY['Clobetasol'],
   'banned',
   'A prescription corticosteroid, not a permitted cosmetic ingredient. Illegally added to fairness creams; causes skin thinning, redness and dependence.'),

  ('Betamethasone',
   ARRAY['Betamethasone valerate', 'Betamethasone dipropionate'],
   'banned',
   'A prescription corticosteroid, not permitted in cosmetics. Misused in skin creams; causes barrier damage and steroid dependence.'),

  ('Hexachlorophene',
   ARRAY['Hexachlorophane'],
   'restricted',
   'Restricted in cosmetics. A neurotoxic antibacterial permitted only within strict limits.'),

  ('Chloroform',
   ARRAY['Trichloromethane'],
   'banned',
   'Prohibited as a cosmetic ingredient. A probable carcinogen and central-nervous-system depressant.'),

  ('Dichloromethane',
   ARRAY['Methylene chloride'],
   'restricted',
   'Restricted in cosmetics. A solvent classified as a possible human carcinogen.'),

  ('Vinyl chloride',
   ARRAY['Chloroethene'],
   'banned',
   'Banned as an aerosol propellant in cosmetics. A known human carcinogen.'),

  ('Tretinoin',
   ARRAY['Retinoic acid', 'All-trans retinoic acid'],
   'restricted',
   'A prescription drug, not permitted in cosmetics. Effective but can cause strong irritation; use only under medical guidance.'),

  ('Arsenic',
   ARRAY['Arsenic compounds', 'Arsenic trioxide'],
   'banned',
   'Banned in cosmetics. A toxic heavy metal and known carcinogen.')
ON CONFLICT (lower(ingredient_name)) DO NOTHING;

-- ============================================================================
-- After running: the products page "restricted ingredient" tier will flag any
-- shelf product whose ingredients match one of these (by name or alias).
-- ============================================================================
