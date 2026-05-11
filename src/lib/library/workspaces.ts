export type WorkspaceTool =
  | "session-prep"
  | "encounter-filters"
  | "grid-info"
  | "vtt-export"
  | "map-notes"
  | "ai-analyze"
  | "star-rating"
  | "color-palette"
  | "exif-info";

export type QuickFilterPreset = {
  id: string;
  label: string;
  icon: string;
  tags: string[];
};

export type WorkspaceDefinition = {
  id: string;
  name: string;
  icon: string;
  tools: WorkspaceTool[];
  quickFilterPresets: QuickFilterPreset[];
  defaultStackVariants: boolean;
  topicId: string | null;
  synonymGroupIds?: string[];
};

export const DND_MAPS_WORKSPACE: WorkspaceDefinition = {
  id: "dnd-maps",
  name: "DnD Maps",
  icon: "swords",
  tools: [
    "encounter-filters",
    "session-prep",
    "map-notes",
    "grid-info",
    "vtt-export",
    "ai-analyze",
  ],
  quickFilterPresets: [
    {
      id: "wilds",
      label: "Wilds",
      icon: "trees",
      tags: ["forest", "camp", "mountain", "desert", "arctic"],
    },
    {
      id: "underground",
      label: "Underground",
      icon: "mountain",
      tags: ["cave", "dungeon", "mine"],
    },
    {
      id: "civilization",
      label: "Civilization",
      icon: "building-2",
      tags: ["town", "tavern", "castle", "ship"],
    },
    {
      id: "voyage",
      label: "Voyage",
      icon: "compass",
      tags: ["ship", "water", "desert", "road"],
    },
    {
      id: "arcane",
      label: "Arcane",
      icon: "sparkles",
      tags: ["purple", "magic", "temple"],
    },
    {
      id: "combat",
      label: "Combat",
      icon: "swords",
      tags: ["large", "wide"],
    },
  ],
  defaultStackVariants: true,
  topicId: "dnd-maps",
};

export const PHOTOGRAPHY_WORKSPACE: WorkspaceDefinition = {
  id: "photography",
  name: "Photography",
  icon: "camera",
  tools: ["star-rating", "color-palette", "exif-info", "ai-analyze"],
  quickFilterPresets: [
    {
      id: "portrait",
      label: "Portrait",
      icon: "user",
      tags: ["portrait", "headshot", "person"],
    },
    {
      id: "landscape",
      label: "Landscape",
      icon: "mountain",
      tags: ["landscape", "scenic", "nature"],
    },
    {
      id: "street",
      label: "Street",
      icon: "building",
      tags: ["street", "urban", "city"],
    },
    {
      id: "macro",
      label: "Macro",
      icon: "flower-2",
      tags: ["macro", "closeup", "detail"],
    },
    {
      id: "night",
      label: "Night",
      icon: "moon",
      tags: ["night", "dark", "low-light"],
    },
  ],
  defaultStackVariants: false,
  topicId: null,
};

export const DESIGN_WORKSPACE: WorkspaceDefinition = {
  id: "design",
  name: "Design",
  icon: "palette",
  tools: ["color-palette", "star-rating", "ai-analyze"],
  quickFilterPresets: [
    {
      id: "icons",
      label: "Icons",
      icon: "grid-3x3",
      tags: ["icon", "glyph", "symbol"],
    },
    {
      id: "ui",
      label: "UI",
      icon: "layout",
      tags: ["mockup", "wireframe", "ui", "component"],
    },
    {
      id: "textures",
      label: "Textures",
      icon: "scan",
      tags: ["texture", "pattern", "material"],
    },
    {
      id: "illustrations",
      label: "Illustrations",
      icon: "pen-tool",
      tags: ["illustration", "drawing", "art"],
    },
  ],
  defaultStackVariants: false,
  topicId: null,
};

export const BUILTIN_WORKSPACES: WorkspaceDefinition[] = [
  DND_MAPS_WORKSPACE,
  PHOTOGRAPHY_WORKSPACE,
  DESIGN_WORKSPACE,
];

export function getWorkspaceById(
  id: string,
): WorkspaceDefinition | null {
  return BUILTIN_WORKSPACES.find((w) => w.id === id) ?? null;
}
