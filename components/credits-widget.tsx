"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditsWidgetProps {
  used: number
  total: number
  className?: string
}

export function CreditsWidget({ used, total, className }: CreditsWidgetProps) {
  const remaining = total - used
  const percentage = (used / total) * 100

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Credits</h3>
          <p className="text-xs text-muted-foreground">
            {remaining} of {total} remaining
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Used this month</span>
          <span className="font-medium text-foreground">{used}/{total}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-8 rounded-md transition-colors",
              i < used
                ? "bg-gradient-to-br from-primary to-accent"
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
}
