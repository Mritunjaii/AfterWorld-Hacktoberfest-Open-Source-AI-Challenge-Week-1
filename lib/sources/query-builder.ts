export type PlaceCategory = 'ancient_monument' | 'educational_institution' | 'natural_landmark' | 'general_heritage';

/**
 * Classifies a place name and context into a recognized category
 * to generate laser-focused research queries.
 */
export function classifyPlaceType(placeName: string, context?: string): PlaceCategory {
  const combined = `${placeName} ${context || ''}`.toLowerCase();

  if (
    combined.includes('institute') ||
    combined.includes('college') ||
    combined.includes('university') ||
    combined.includes('school') ||
    combined.includes('academy') ||
    combined.includes('campus') ||
    combined.includes('polytechnic')
  ) {
    return 'educational_institution';
  }

  if (
    combined.includes('mountain') ||
    combined.includes('valley') ||
    combined.includes('river') ||
    combined.includes('national park') ||
    combined.includes('gorge') ||
    combined.includes('glacier') ||
    combined.includes('forest') ||
    combined.includes('canyon')
  ) {
    return 'natural_landmark';
  }

  if (
    combined.includes('colosseum') ||
    combined.includes('temple') ||
    combined.includes('amphitheatre') ||
    combined.includes('pyramid') ||
    combined.includes('fort') ||
    combined.includes('castle') ||
    combined.includes('citadel') ||
    combined.includes('tomb') ||
    combined.includes('mausoleum') ||
    combined.includes('parthenon') ||
    combined.includes('acropolis') ||
    combined.includes('ancient') ||
    combined.includes('ruins')
  ) {
    return 'ancient_monument';
  }

  return 'general_heritage';
}

/**
 * Builds targeted query sets based on place identity.
 * Returns primary targeted query and an optional secondary deep query.
 */
export function buildFocusedQueries(
  placeName: string,
  category: PlaceCategory
): { primary: string; secondary: string; visitor: string } {
  const cleanName = placeName.replace(/,\s*[^,]+$/, '').trim(); // Remove trailing region if duplicate

  switch (category) {
    case 'educational_institution':
      return {
        primary: `"${cleanName}" official history foundation`,
        secondary: `"${cleanName}" official campus research departments`,
        visitor: `"${cleanName}" official institutional profile`,
      };
    case 'natural_landmark':
      return {
        primary: `"${cleanName}" geological origin national park history`,
        secondary: `"${cleanName}" ecological biodiversity conservation`,
        visitor: `"${cleanName}" official visitor guide`,
      };
    case 'ancient_monument':
      return {
        primary: `"${cleanName}" official history construction architect`,
        secondary: `"${cleanName}" archaeological excavation heritage site`,
        visitor: `"${cleanName}" official visitor information museum`,
      };
    case 'general_heritage':
    default:
      return {
        primary: `"${cleanName}" documented history heritage origin`,
        secondary: `"${cleanName}" architectural significance preservation`,
        visitor: `"${cleanName}" official site visitor guide`,
      };
  }
}
