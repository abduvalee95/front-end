import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Status pill.
 *
 * Canonical API — `variant="success | warning | danger | neutral"`, plus
 * `primary` for accent-coloured tags. Each pairs a `-muted` surface with an
 * `-emphasis` ink; both pairings clear WCAG AA in light and dark themes.
 *
 * `default`, `secondary`, `destructive` and `outline` are aliases kept for
 * existing call sites.
 */
const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1",
    "overflow-hidden rounded-control border border-transparent",
    "px-2 py-0.5 text-caption font-medium whitespace-nowrap",
    "transition-colors",
    "focus-visible:ring-2 focus-visible:ring-ring/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        success: "bg-success-muted text-success-emphasis",
        warning: "bg-warning-muted text-warning-emphasis",
        danger: "bg-danger-muted text-danger-emphasis",
        neutral: "bg-neutral-muted text-neutral-emphasis",
        primary: "bg-primary-muted text-primary-emphasis dark:text-primary",
        info: "bg-info-muted text-info-emphasis",
        solid: "bg-primary text-primary-foreground",

        // ── Aliases ──
        default: "bg-primary-muted text-primary-emphasis dark:text-primary",
        secondary: "bg-neutral-muted text-neutral-emphasis",
        destructive: "bg-danger-muted text-danger-emphasis",
        outline: "border-border text-foreground",
        ghost: "text-muted-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
