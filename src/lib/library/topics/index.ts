export type TopicDictionary = {
  id: string;
  name: string;
  keywords: Record<string, string[]>;
};

import { DND_MAPS_TOPIC } from "./dnd-maps";
import { GENERIC_TOPIC } from "./generic";

export const TOPICS: TopicDictionary[] = [DND_MAPS_TOPIC, GENERIC_TOPIC];

export function getTopicById(id: string): TopicDictionary | null {
  return TOPICS.find((t) => t.id === id) ?? null;
}

export function matchTopicKeywords(
  tokens: string[],
  topic: TopicDictionary,
): string[] {
  const matched = new Set<string>();
  const lower = tokens.map((t) => t.toLowerCase());
  for (const [category, keywords] of Object.entries(topic.keywords)) {
    for (const kw of keywords) {
      if (lower.some((t) => t.includes(kw))) {
        matched.add(category);
        break;
      }
    }
  }
  return Array.from(matched);
}
