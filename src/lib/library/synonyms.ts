const SYNONYM_GROUPS: string[][] = [
  ["tavern", "inn", "pub", "bar", "brewhouse", "alehouse", "taproom"],
  ["forest", "wood", "woods", "woodland", "grove", "glade", "thicket", "jungle"],
  ["cave", "cavern", "grotto", "underground", "tunnel", "underdark"],
  ["dungeon", "crypt", "tomb", "catacomb", "corridor", "chamber", "vault"],
  ["town", "village", "city", "settlement", "hamlet", "market", "street"],
  ["castle", "fortress", "keep", "citadel", "stronghold", "palace"],
  ["ship", "boat", "vessel", "galleon", "deck", "dock", "port", "wharf"],
  ["water", "ocean", "sea", "lake", "river", "stream", "pond", "waterfall"],
  ["desert", "sand", "dune", "oasis", "arid", "wasteland"],
  ["snow", "ice", "arctic", "frozen", "tundra", "winter", "glacier", "blizzard"],
  ["mountain", "cliff", "peak", "canyon", "ridge", "summit", "plateau"],
  ["swamp", "marsh", "bog", "wetland", "bayou", "fen", "mire"],
  ["camp", "campfire", "tent", "clearing", "bivouac"],
  ["road", "path", "trail", "crossroad", "bridge", "gate"],
  ["temple", "shrine", "altar", "church", "chapel", "sanctuary", "cathedral"],
  ["battle", "arena", "colosseum", "pit", "fighting"],
  ["mine", "quarry", "excavation", "dig"],
  ["tower", "spire", "lighthouse", "watchtower", "turret"],
  ["garden", "park", "courtyard", "greenhouse", "orchard"],
  ["sewer", "drain", "aqueduct", "canal", "waterway"],
  ["graveyard", "cemetery", "necropolis", "burial", "mausoleum"],
  ["prison", "jail", "cell", "dungeon", "cage"],
  ["library", "archive", "study", "scriptorium", "bookshop"],
  ["throne", "court", "audience", "hall", "ballroom"],
];

const tokenToGroup = new Map<string, string[]>();

for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    tokenToGroup.set(word, group);
  }
}

export function expandSynonyms(token: string): string[] {
  const group = tokenToGroup.get(token);
  if (!group) return [token];
  return group;
}

export function getSynonymHint(token: string): string[] | null {
  const group = tokenToGroup.get(token);
  if (!group || group.length <= 1) return null;
  return group.filter((w) => w !== token);
}

export function expandAllTokens(
  tokens: string[],
): { expanded: string[][]; hints: Map<string, string[]> } {
  const expanded: string[][] = [];
  const hints = new Map<string, string[]>();
  for (const t of tokens) {
    const group = expandSynonyms(t);
    expanded.push(group);
    const hint = getSynonymHint(t);
    if (hint) hints.set(t, hint);
  }
  return { expanded, hints };
}
