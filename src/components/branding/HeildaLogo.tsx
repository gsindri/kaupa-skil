
import React from 'react';

interface HeildaLogoProps {
  className?: string;
}

export function HeildaLogo({ className = "h-[30px] w-auto" }: HeildaLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 64"
      role="img"
      aria-label="Heilda"
    >
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C7793B" />
          <stop offset="1" stopColor="#F6B044" />
        </linearGradient>
        <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5F7597" />
          <stop offset="1" stopColor="#D18A3A" />
        </linearGradient>
      </defs>

      {/* Arc */}
      <path
        d="M25,34 A16,16 0 0 1 41,20"
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Wordmark */}
      <text
        x="46"
        y="42"
        fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="500"
        fontSize="30"
        letterSpacing=".02em"
        fill="url(#textGrad)"
        stroke="#0B1220"
        strokeWidth=".22"
        strokeOpacity=".10"
        style={{ paintOrder: "stroke fill", strokeLinejoin: "round" }}
      >
        Heilda
      </text>
    </svg>
  );
}
