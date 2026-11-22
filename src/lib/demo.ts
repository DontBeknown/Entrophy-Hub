export const postTypes = ["build", "tactic", "combo", "speedrun"] as const;
export type PostType = typeof postTypes[number];
export const typeLabels: Record<PostType, string> = {
  build: "Builds", tactic: "Tactics", combo: "Combos", speedrun: "Speedruns",
};

export type Character = { slug: string; name: string; color: string; portrait?: string };
export const characters: Character[] = [
  { slug: "ragna", name: "Ragna", color: "#ec407a" },
  { slug: "noel", name: "Noel", color: "#4468ff" },
  { slug: "jin", name: "Jin", color: "#7496ff" },
  { slug: "hakumen", name: "Hakumen", color: "#9e88ed" },
  { slug: "hibiki", name: "Hibiki Kohaku", color: "#7280ad" },
  { slug: "lambda-11", name: "Lambda-11", color: "#bc87e5" },
  { slug: "es", name: "Es", color: "#5a8ce8" },
  { slug: "taokaka", name: "Taokaka", color: "#d69158" },
  { slug: "kokonoe", name: "Kokonoe", color: "#cf74c0" },
  { slug: "mai", name: "Mai Natsume", color: "#ed6a8c" },
  { slug: "rachel", name: "Rachel Alucard", color: "#bf5c89" },
  { slug: "hazama", name: "Hazama", color: "#68b195" },
  { slug: "icey", name: "ICEY", color: "#55b5da" },
  { slug: "bullet", name: "Bullet", color: "#c37262" },
  { slug: "the-prisoner", name: "The Prisoner", color: "#ef784f" },
  { slug: "naoto", name: "Naoto Kurogane", color: "#a978e5" },
  { slug: "platinum", name: "Platinum the Trinity", color: "#ef99c5" },
].map((character) => ({ ...character, portrait: `/portraits/${character.slug}-silhouette.webp` }));

export type Post = {
  id: string; title: string; description: string; character: string; type: PostType;
  author: string; author_id?: string; published_at: string; version?: string; difficulty?: string;
  body: Record<string, string>; video?: string; demo_video?: boolean;
  likes: number; dislikes: number; comments: number;
};

const defaults = { published_at: "2026-11-22T04:00:00Z", likes: 0, dislikes: 0, comments: 0 };
export const demoPosts: Post[] = [
  { ...defaults, id: "corner-launcher", type: "combo", character: "ragna", title: "Corner launcher route",
    description: "Ragna combo for strong corner carry.", author: "BladeSignal", demo_video: true,
    body: { sequence: "Dash in | → → + D\nLaunch | ↑ + D\nAir follow-up | ↑ → + D", timing: "Start near the corner. Wait until the launch connects before following up." } },
  { ...defaults, id: "fast-clear", type: "build", character: "noel", title: "Fast clear build (Stage 3+)",
    description: "A consistent setup for fast clears.", author: "KiteFx",
    body: { upgrades: "Prioritize reliable ranged damage.", tactics: "Keep your distance from crowds.", alternatives: "Choose mobility when a damage upgrade does not appear." } },
  { ...defaults, id: "boss-spacing", type: "tactic", character: "jin", title: "Make space before the boss wind-up",
    description: "A simple approach to punishing slow attacks.", author: "KiteFx",
    body: { situation: "When an enemy starts a long attack animation.", steps: "Move out of range.\nWait for the hit.\nPunish the recovery.", notes: "Keep an escape option available." } },
  { ...defaults, id: "practice-run", type: "speedrun", character: "hakumen", title: "Practice run with a flexible route",
    description: "A recorded practice route for a first timed run.", author: "BladeSignal", demo_video: true,
    body: { category: "Any%", time: "00:18:42", route: "Choose the shortest safe path through each stage." } },
];
