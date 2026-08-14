import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge has to be told about the design system's custom scales.
 *
 * Without this it sees `text-body` / `text-caption` / `text-h3`, fails to
 * recognise them as font sizes, and files them under *text colour* instead.
 * A class list like `text-primary-foreground … text-body` then looks like two
 * competing colours, so the real colour is dropped and the element silently
 * inherits its parent's ink — e.g. the login button rendering dark-on-dark.
 *
 * Registering the scales here keeps size and colour in separate conflict
 * groups, and lets `rounded-card` / `shadow-card-hover` override the built-in
 * `rounded-*` / `shadow-*` utilities the way any other override would.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "h1", "h2", "h3", "h4", "body", "body-sm", "caption"] },
      ],
      rounded: [{ rounded: ["card", "control"] }],
      shadow: [{ shadow: ["card", "card-hover"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
