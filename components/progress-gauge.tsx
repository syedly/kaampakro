"use client"

import { cn } from "@/lib/utils"

interface ProgressGaugeProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  className?: string
}

export function ProgressGauge({
  value,
  max = 100,
  size = 140,
  strokeWidth = 12,
  label,
  sublabel,
  className,
}: ProgressGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((value / max) * 100, 100)
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.55 0.24 275)" />
            <stop offset="100%" stopColor="oklch(0.65 0.22 290)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-foreground">{percentage.toFixed(0)}%</span>
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        {sublabel && <span className="text-xs text-muted-foreground/70">{sublabel}</span>}
      </div>
    </div>
  )
}
