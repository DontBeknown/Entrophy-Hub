export type VideoType = "combo" | "speedrun";

export const videoRules = {
  combo: { bucket: "combo-clips", maxBytes: 50 * 1024 ** 2, limit: "50 MiB", label: "Combo clip" },
  speedrun: { bucket: "speedrun-recordings", maxBytes: 2 * 1024 ** 3, limit: "2 GiB", label: "Run recording" },
} as const;

export function isVideoType(value: unknown): value is VideoType {
  return value === "combo" || value === "speedrun";
}
