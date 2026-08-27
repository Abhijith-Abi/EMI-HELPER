import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-[0.98]",
        outline:
          "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]",
        secondary:
          "bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.98]",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/[0.08]",
        destructive:
          "bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white",
        link: "text-indigo-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4 text-xs",
        xs: "h-7 gap-1 px-2.5 text-[11px]",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-11 gap-2 px-5 text-sm",
        icon: "h-10 w-10 p-0",
        "icon-xs": "h-6 w-6 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-11 w-11 p-0",
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
