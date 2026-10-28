import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-church-gold text-white hover:bg-church-gold-hover shadow-sm active:scale-[0.98]",
        outline:
          "border-2 border-church-gold/30 bg-transparent text-church-gold-dark hover:bg-church-gold/10 hover:border-church-gold active:scale-[0.98]",
        secondary:
          "bg-church-cream-dark text-church-stone-dark hover:bg-church-stone active:scale-[0.98]",
        ghost:
          "bg-transparent text-church-stone-dark hover:bg-church-gold/10 hover:text-church-gold-dark",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        link:
          "text-church-gold-dark underline-offset-4 hover:underline p-0 h-auto",
        white:
          "bg-white text-church-rock hover:bg-amber-50/90 shadow-md active:scale-[0.98]",
        "white-outline":
          "border-2 border-white/90 bg-transparent text-white hover:bg-white/20 backdrop-blur-xs active:scale-[0.98]",
        rock:
          "bg-church-rock text-white hover:bg-church-rock-slate shadow-sm active:scale-[0.98]",
      },
      size: {
        default:
          "h-11 px-5 py-2.5 text-sm gap-2 rounded-xl",
        sm:
          "h-9 px-3.5 py-1.5 text-xs gap-1.5 rounded-lg",
        lg:
          "h-12 px-7 py-3 text-base gap-2 rounded-xl font-medium",
        xl:
          "h-14 px-8 py-3.5 text-base sm:text-lg gap-2.5 rounded-full font-serif font-semibold tracking-wide",
        icon:
          "size-10 rounded-xl",
        "icon-sm":
          "size-8 rounded-lg",
        "icon-lg":
          "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
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
