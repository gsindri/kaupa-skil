import * as React from "react";
import { cn } from "@/lib/utils";

// --- New Components from User ---

type DeildaIconProps = React.SVGProps<SVGSVGElement> & {
  primaryColor?: string;
  accentColor?: string;
};

export function DeildaIconOffsetRings({
  primaryColor = "#020617", // near-slate-950
  accentColor = "#0D9488",  // teal
  ...props
}: DeildaIconProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      aria-label="Deilda icon"
      role="img"
      {...props}
    >
      <g>
        {/* Left ring */}
        <circle
          cx={32}
          cy={40}
          r={24}
          fill="none"
          stroke={primaryColor}
          strokeWidth={7}
        />
        {/* Right ring */}
        <circle
          cx={48}
          cy={40}
          r={24}
          fill="none"
          stroke={accentColor}
          strokeWidth={7}
          opacity={0.7}
        />
        {/* Intersection accent */}
        <ellipse
          cx={40}
          cy={40}
          rx={8}
          ry={18}
          fill={accentColor}
          opacity={0.22}
        />
      </g>
    </svg>
  );
}

type DeildaLogoProps = {
  primaryColor?: string;
  accentColor?: string;
  wordmarkColor?: string;
  showWordmark?: boolean;
  className?: string;
};

export function DeildaLogoOffsetRings({
  primaryColor = "#020617",
  accentColor = "#0D9488",
  wordmarkColor = "#020617",
  showWordmark = true,
  className,
}: DeildaLogoProps) {
  return (
    <div
      className={
        "inline-flex items-center gap-3" +
        (className ? ` ${className}` : "")
      }
    >
      <DeildaIconOffsetRings
        primaryColor={primaryColor}
        accentColor={accentColor}
        className="h-8 w-8 flex-shrink-0"
      />

      {showWordmark && (
        <span
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontWeight: 500,
            letterSpacing: -0.04 + "em",
            color: wordmarkColor,
          }}
          className="text-[1.65rem] leading-none"
        >
          deilda
        </span>
      )}
    </div>
  );
}

// --- Wrapper for backward compatibility ---

interface HeildaLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export function HeildaLogo({ className, variant = 'light' }: HeildaLogoProps) {
  // Light variant = White logo (for dark backgrounds)
  if (variant === 'light') {
    return (
      <DeildaLogoOffsetRings
        className={className}
        primaryColor="#E5E7EB"
        accentColor="#22D3EE"
        wordmarkColor="#F9FAFB"
      />
    );
  }

  // Dark variant = Dark logo (for light backgrounds)
  if (variant === 'dark') {
    return (
      <DeildaLogoOffsetRings
        className={className}
        primaryColor="#020617"
        accentColor="#0D9488"
        wordmarkColor="#020617"
      />
    );
  }

  // Auto variant = Adapts to dark mode
  // We render both and toggle visibility with CSS classes
  return (
    <div className={cn("grid place-items-center", className)}>
      {/* Dark mode version (visible in dark) */}
      <div className="col-start-1 row-start-1 hidden dark:block">
        <DeildaLogoOffsetRings
          primaryColor="#E5E7EB"
          accentColor="#22D3EE"
          wordmarkColor="#F9FAFB"
          className="h-full w-auto"
        />
      </div>
      {/* Light mode version (visible in light) */}
      <div className="col-start-1 row-start-1 block dark:hidden">
        <DeildaLogoOffsetRings
          primaryColor="#020617"
          accentColor="#0D9488"
          wordmarkColor="#020617"
          className="h-full w-auto"
        />
      </div>
    </div>
  );
}
