import type { PostType } from "./demo";

type Field = { key: string; label: string; required?: boolean; max?: number; multiline?: boolean; hint?: string };
export const editorFields: Record<PostType, Field[]> = {
  build: [
    { key: "upgrades", label: "Priority upgrades", required: true, multiline: true },
    { key: "tactics", label: "Tactics", required: true, multiline: true },
    { key: "alternatives", label: "Alternatives", required: true, multiline: true },
  ],
  tactic: [
    { key: "situation", label: "Situation", required: true, multiline: true },
    { key: "steps", label: "Steps", required: true, multiline: true, hint: "Enter one step per line." },
    { key: "notes", label: "When to use it", multiline: true },
  ],
  combo: [
    { key: "sequence", label: "Input sequence", required: true, multiline: true, hint: "Enter one move per line, for example Dash in | → → + D." },
    { key: "timing", label: "Timing and positioning", multiline: true },
    { key: "upgrades", label: "Required upgrades", multiline: true },
  ],
  speedrun: [
    { key: "category", label: "Category", required: true, max: 80 },
    { key: "time", label: "Run time", required: true, max: 9, hint: "Use HH:MM:SS." },
    { key: "route", label: "Route notes", multiline: true },
  ],
};
