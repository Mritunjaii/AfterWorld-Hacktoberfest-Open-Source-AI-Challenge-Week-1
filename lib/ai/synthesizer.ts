import { Place } from '@/types';

/**
 * Generates an articulate, grounded historical fallback narrative from verified facts
 * when an open-weight model endpoint is unavailable.
 * Strictly adheres to truthfulness: never claims AI generation and never hallucinates.
 */
export function generateGroundedHistoricalProse(placeName: string, facts: { claim: string }[]): string {
  if (!facts || facts.length === 0) {
    return `Verified historical records for ${placeName} are currently sparse. We prioritize documented truth and do not construct ungrounded narratives without primary source material.`;
  }

  // Deduplicate claims
  const distinctClaims = Array.from(
    new Set(facts.map((f) => f.claim.replace(/\s+/g, ' ').trim()))
  );

  // Group into a well-crafted chronological reading
  if (distinctClaims.length === 1) {
    return `According to verified historical archives, ${distinctClaims[0]}`;
  }

  const [opening, ...rest] = distinctClaims;
  const body = rest.join(' ');

  return `Documented records chronicle that ${opening} Over subsequent eras, archival evidence confirms: ${body}`;
}

/**
 * Generates a thoughtful, context-aware speculative future narrative tailored to the place's identity.
 */
export function generateTailoredFutureNarrative(
  placeName: string,
  summary?: string,
  presentContext?: string
): { story: string; assumptions: string[] } {
  const combinedContext = `${placeName} ${summary || ''} ${presentContext || ''}`.toLowerCase();

  if (combinedContext.includes('institute') || combinedContext.includes('college') || combinedContext.includes('university') || combinedContext.includes('school')) {
    return {
      story: `Three centuries into the future, ${placeName} has transcended conventional physical boundaries to become a symbiotic biocentric academy. Nestled amidst regenerative forest canopies, scholars collaborate with ambient neural archives, investigating planetary restoration and quantum metallurgy. The historic foundation stones of the 20th century remain preserved at the campus nucleus—reminding future cohorts of the early engineers who first calibrated technology in these hills.`,
      assumptions: [
        'Decentralized higher education integrated directly with regional ecological restoration.',
        'Preservation of original engineering heritage halls as commemorative archives.',
      ],
    };
  }

  if (combinedContext.includes('temple') || combinedContext.includes('wat') || combinedContext.includes('sanctuary') || combinedContext.includes('amphitheatre') || combinedContext.includes('colosseum') || combinedContext.includes('parthenon')) {
    return {
      story: `Centuries hence, the enduring stonework of ${placeName} stands bathed in twilight, sheltered beneath atmospheric shielding that deflects corrosive weather cycles. The former throng of fleeting visitors has transformed into quiet pilgrimages of stewardship, where artisans and conservators apply micro-mineral bonding to safeguard ancient carvings. At dusk, acoustic resonances still echo across the plazas, honoring the centuries of human aspiration held within its walls.`,
      assumptions: [
        'Deployment of non-invasive micro-mineral conservation to preserve stone against environmental weathering.',
        'Shift from high-volume tourism to reverent, low-impact cultural stewardship.',
      ],
    };
  }

  return {
    story: `Centuries into the future, ${placeName} endures as a beacon of continuity amidst a transformed landscape. Sustainable architectural pavilions weave through its perimeter, capturing clean atmospheric moisture and solar currents while leaving the original historic landmarks untouched. Generations gather here to reflect upon the continuous thread connecting ancestral memory to a harmonious ecological tomorrow.`,
    assumptions: [
      'Zero-emission renewable energy and water harvesting surrounding the site.',
      'Cultural preservation of historic roots within adaptive urban biomes.',
    ],
  };
}
