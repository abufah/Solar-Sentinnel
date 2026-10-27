import React from "react";

interface ModernLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  sublabel?: string;
}

export function ModernLoader({ size = "md", label, sublabel }: ModernLoaderProps) {
  const sizeMap = {
    sm: "size-5",
    md: "size-8",
    lg: "size-12",
    xl: "size-16",
  };

  const strokeMap = {
    sm: 2,
    md: 2.5,
    lg: 3,
    xl: 3.5,
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Soft atmospheric ambient glow */}
        <div
          className={`absolute rounded-full bg-primary/20 blur-md ${
            size === "sm"
              ? "size-6"
              : size === "md"
                ? "size-12"
                : size === "lg"
                  ? "size-16"
                  : "size-24"
          } animate-pulse-subtle`}
        />

        {/* Outer glowing trace ring */}
        <svg
          className={`${sizeMap[size]} -rotate-90 animate-spin-smooth`}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle track background */}
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth={strokeMap[size]}
            className="text-muted/30"
          />
          {/* Flowing animated gradient arc */}
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="url(#solarLoaderGrad)"
            strokeWidth={strokeMap[size]}
            strokeDasharray="113"
            strokeDashoffset="45"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="solarLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center glowing dot */}
        <span
          className={`absolute rounded-full bg-primary ${
            size === "sm" ? "size-1" : size === "md" ? "size-1.5" : "size-2"
          } animate-ping opacity-60`}
        />
      </div>

      {label ? (
        <div className="text-center">
          <p className="text-sm font-medium tracking-tight text-foreground">{label}</p>
          {sublabel ? <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function PulseIndicator({ active = true, label }: { active?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex size-2">
        {active ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 duration-1000" />
        ) : null}
        <span
          className={`relative inline-flex size-2 rounded-full ${
            active
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
              : "bg-muted-foreground/40"
          }`}
        />
      </span>
      {label ? <span className="text-xs font-medium text-foreground">{label}</span> : null}
    </span>
  );
}
