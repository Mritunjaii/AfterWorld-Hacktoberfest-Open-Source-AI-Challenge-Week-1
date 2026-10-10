import { Fact } from '@/types';

/**
 * Builds a chronological, high-quality Past story prompt grounded strictly in evidence.
 * Explicitly instructs the model to avoid repetitive introductory regurgitation.
 */
export function buildPastStoryPrompt(
  placeName: string,
  facts: Fact[],
  summary?: string
): { system: string; user: string } {
  // Deduplicate facts by claim prefix
  const uniqueFacts: Fact[] = [];
  const seenClaims = new Set<string>();

  for (const f of facts) {
    const key = f.claim.toLowerCase().slice(0, 35);
    if (!seenClaims.has(key)) {
      seenClaims.add(key);
      uniqueFacts.push(f);
    }
  }

  const factList = uniqueFacts
    .map((f, i) => `[Evidence ${f.id}]: ${f.claim} (Publisher: ${f.sourceTitle})`)
    .join('\n');

  const system = `You are an expert historian and literary chronicler for AFTERWORLD.
Your job is to transform documented historical evidence into a coherent, flowing 150-250 word narrative.

STRICT EDITORIAL RULES:
1. Do NOT repeat or regurgitate the introductory definition word-for-word.
2. Structure the story with a clear arc: Beginning (origins/founding), Middle (evolution, challenges, or architectural creation), and Culmination.
3. Ground every event, date, name, and architectural detail ONLY in the provided evidence statements.
4. NEVER invent dates, people, casualties, quotes, or citations.
5. If evidence is brief, write a tight, elegant 100-140 word chronicle. Never pad with generic filler or clichés like "echoes through the corridors of time".
6. Output pure JSON without markdown backticks:
{
  "story": "Your vivid, non-repetitive grounded historical chronicle...",
  "factIdsUsed": ["evidence_id_1", "evidence_id_2"]
}`;

  const user = `Subject: "${placeName}"
Evidence Archive:
${factList}

Compose the non-repetitive historical narrative using ONLY the evidence above:`;

  return { system, user };
}

/**
 * Builds an authentic, location-specific future story prompt that contemplates
 * the real purpose, ecology, and architecture of the specific site.
 */
export function buildFutureStoryPrompt(
  placeName: string,
  presentContext?: string,
  summary?: string
): { system: string; user: string } {
  const system = `You are a visionary speculative fiction author for AFTERWORLD.
Your job is to write a thoughtful, place-specific imagined future (150-250 words) set 100 to 400 years from now.

STRICT EDITORIAL RULES:
1. The narrative MUST be intimately tailored to the specific identity and purpose of "${placeName}".
   - If it is an educational institute or university, explore future research, cognitive learning, campus ecology, and student collectives.
   - If it is an ancient citadel or monument, explore future stone conservation, climate shifts, and spiritual stewardship.
   - If it is an urban landmark, explore civic transformation, renewable habitats, and enduring memory.
2. Avoid generic sci-fi clichés (e.g. avoid flying cars, neon holograms, or cookie-cutter dystopian tropes).
3. Anchor the narrative in plausible ecological, architectural, and cultural shifts.
4. Provide 2 to 3 explicit, thoughtful assumptions explaining the scenario.
5. Output pure JSON without markdown backticks:
{
  "story": "Your 150-250 word place-specific imagined future narrative...",
  "assumptions": [
    "Assumption 1 regarding ecological or climatic adaptation",
    "Assumption 2 regarding institutional, technological, or community evolution"
  ]
}`;

  const user = `Location: "${placeName}"
Present Context: ${presentContext || summary || 'Historical site facing evolving modern surroundings.'}

Envision a distinct, plausible future:`;

  return { system, user };
}
