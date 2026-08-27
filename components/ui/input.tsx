import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
