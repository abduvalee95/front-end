/**
 * The five tones every surface in the product is allowed to use.
 *
 * Each tone is a token pair — a `-muted` surface and an `-emphasis` ink —
 * verified to clear WCAG AA in both themes. Components map a `tone` prop
 * through these tables instead of inventing per-page colours.
 */
export type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

/** Soft surface + ink, for icon tiles, chips and stat accents. */
export const TONE_SURFACE: Record<Tone, string> = {
  primary: "bg-primary-muted text-primary-emphasis dark:text-primary",
  success: "bg-success-muted text-success-emphasis",
  warning: "bg-warning-muted text-warning-emphasis",
  danger: "bg-danger-muted text-danger-emphasis",
  neutral: "bg-neutral-muted text-neutral-emphasis",
};

/** Ink only, for values and labels drawn straight on a card. */
export const TONE_INK: Record<Tone, string> = {
  primary: "text-primary-emphasis dark:text-primary",
  success: "text-success-emphasis",
  warning: "text-warning-emphasis",
  danger: "text-danger-emphasis",
  neutral: "text-foreground",
};

/** Solid fill, for progress bars and filled indicators. */
export const TONE_FILL: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
};

/** Badge variant that corresponds to a tone. */
export const TONE_BADGE: Record<Tone, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  primary: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
};
