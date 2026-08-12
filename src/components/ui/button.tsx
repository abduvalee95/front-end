import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * The product's only button.
 *
 * Canonical API — `variant="primary | secondary | ghost | danger"` and
 * `size="sm | md"`. Every visual value comes from a design token, so a button
 * looks identical on Dashboard, Journal, Schedule and Settings.
 *
 * `default`, `outline`, `destructive`, `lg`, `xs` and `icon-lg` are retained
 * as aliases of the canonical set so existing call sites keep compiling; they
 * render the canonical styling, not a second design.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-control border border-transparent bg-clip-padding",
    "font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow] duration-200",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/25",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-card hover:bg-primary-emphasis",
        secondary:
          "border-border bg-card text-foreground shadow-card hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        danger:
          "bg-danger-muted text-danger-emphasis hover:bg-danger hover:text-danger-foreground focus-visible:ring-danger/50",

        // ── Aliases ──
        default:
          "bg-primary text-primary-foreground shadow-card hover:bg-primary-emphasis",
        outline:
          "border-border bg-card text-foreground shadow-card hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "bg-danger-muted text-danger-emphasis hover:bg-danger hover:text-danger-foreground focus-visible:ring-danger/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        md: "h-9 px-4 text-body-sm",
        sm: "h-8 px-3 text-caption",

        // ── Aliases ──
        default: "h-9 px-4 text-body-sm",
        lg: "h-10 px-5 text-body",
        xs: "h-7 px-2.5 text-caption [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-9",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
