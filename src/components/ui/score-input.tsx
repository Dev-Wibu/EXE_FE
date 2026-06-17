"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface ScoreInputProps {
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Accent colour token – defaults to indigo palette */
  accent?: "indigo" | "emerald" | "amber" | "rose";
  className?: string;
  disabled?: boolean;
  variant?: "simple" | "circular";
  size?: "sm" | "md" | "lg";
}

const ACCENT_MAP = {
  indigo: {
    text: "text-indigo-600 dark:text-indigo-400",
    border:
      "border-indigo-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/20 dark:border-indigo-800",
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    btn: "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40",
    stroke: "#6366f1",
    strokeDark: "#818cf8",
    track: "stroke-slate-200 dark:stroke-slate-800",
    glow: "shadow-indigo-500/10",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    border:
      "border-emerald-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/20 dark:border-emerald-800",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    btn: "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
    stroke: "#10b981",
    strokeDark: "#34d399",
    track: "stroke-slate-200 dark:stroke-slate-800",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    border:
      "border-amber-200 focus-within:border-amber-500 focus-within:ring-amber-500/20 dark:border-amber-800",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    btn: "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40",
    stroke: "#f59e0b",
    strokeDark: "#fbbf24",
    track: "stroke-slate-200 dark:stroke-slate-800",
    glow: "shadow-amber-500/10",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    border:
      "border-rose-200 focus-within:border-rose-500 focus-within:ring-rose-500/20 dark:border-rose-800",
    bg: "bg-rose-50/50 dark:bg-rose-950/20",
    btn: "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40",
    stroke: "#f43f5e",
    strokeDark: "#f43f5e",
    track: "stroke-slate-200 dark:stroke-slate-800",
    glow: "shadow-rose-500/10",
  },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function ScoreInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  accent = "indigo",
  className,
  disabled = false,
  variant = "simple",
  size = "md",
}: ScoreInputProps) {
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState(String(value));
  const inputRef = React.useRef<HTMLInputElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const commit = (rawVal: string) => {
    const n = parseInt(rawVal, 10);
    if (!isNaN(n)) onChange(clamp(n, min, max));
    else onChange(value);
    setEditing(false);
  };

  const stepUp = () => !disabled && onChange(clamp(value + step, min, max));
  const stepDown = () => !disabled && onChange(clamp(value - step, min, max));

  // Sync raw value when value changes externally
  React.useEffect(() => {
    if (!editing) setRaw(String(value));
  }, [value, editing]);

  // Focus input when editing starts
  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const colors = ACCENT_MAP[accent];

  // Circular logic
  const handleUpdate = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current || disabled) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      // Angle clockwise starting from top (12 o'clock)
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;

      const pct = angle / (2 * Math.PI);
      const newValue = Math.round((pct * (max - min) + min) / step) * step;
      onChange(clamp(newValue, min, max));
    },
    [min, max, step, onChange, disabled]
  );

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleUpdate(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleUpdate(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleUpdate]);

  if (variant === "circular") {
    const radius = 50;
    const strokeWidth = 8;
    const center = 60;
    const circumference = 2 * Math.PI * radius;
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    // Angle for thumb position (from -Math.PI / 2 at top, clockwise)
    const angleRad = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    const tx = center + radius * Math.cos(angleRad);
    const ty = center + radius * Math.sin(angleRad);

    const activeStroke = colors.stroke;

    const sizeClasses = {
      sm: "h-24 w-24",
      md: "h-28 w-28",
      lg: "h-36 w-36",
    }[size];

    return (
      <div className={cn("flex flex-col items-center justify-center gap-1.5 py-1", className)}>
        {/* Circular Slider Container */}
        <div className={cn("relative select-none", sizeClasses)}>
          {/* Inner Input Area */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {editing ? (
              <input
                ref={inputRef}
                type="number"
                min={min}
                max={max}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                onBlur={() => commit(raw)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(raw);
                  if (e.key === "Escape") setEditing(false);
                }}
                className={cn(
                  "pointer-events-auto h-8 w-14 rounded-md text-center font-extrabold tabular-nums",
                  size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl",
                  "border border-slate-300 bg-white text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                )}
              />
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setRaw(String(value));
                  setEditing(true);
                }}
                className={cn(
                  "pointer-events-auto text-center font-black tracking-tight tabular-nums transition-transform hover:scale-105 focus:outline-none active:scale-95",
                  size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl",
                  colors.text
                )}>
                {value}
              </button>
            )}
            <span className="mt-0.5 text-[9px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              /{max}
            </span>
          </div>

          {/* SVG Ring */}
          <svg
            ref={svgRef}
            viewBox="0 0 120 120"
            className={cn(
              "h-full w-full transform cursor-pointer overflow-visible drop-shadow-sm transition-opacity",
              disabled && "cursor-not-allowed opacity-40"
            )}
            onMouseDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              setIsDragging(true);
              handleUpdate(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              if (disabled) return;
              setIsDragging(true);
              if (e.touches.length > 0) {
                handleUpdate(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}>
            {/* Background Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className={colors.track}
            />

            {/* Active Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={activeStroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-all duration-75"
            />

            {/* Drag Handle (Thumb) */}
            {!disabled && (
              <circle
                cx={tx}
                cy={ty}
                r={7}
                fill="#ffffff"
                stroke={activeStroke}
                strokeWidth={3}
                className={cn(
                  "cursor-grab shadow-lg transition-transform hover:scale-125 focus:outline-none active:cursor-grabbing",
                  isDragging && "scale-125 cursor-grabbing"
                )}
              />
            )}
          </svg>
        </div>

        {/* Stepper buttons underneath for accessibility/precision */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled || value <= min}
            onClick={stepDown}
            className={cn(
              "flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
              size === "sm" ? "h-6 w-6" : "h-7 w-7",
              "disabled:cursor-not-allowed disabled:opacity-30",
              "hover:border-slate-300 dark:hover:border-slate-700",
              colors.btn
            )}>
            <Minus className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
          <button
            type="button"
            disabled={disabled || value >= max}
            onClick={stepUp}
            className={cn(
              "flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
              size === "sm" ? "h-6 w-6" : "h-7 w-7",
              "disabled:cursor-not-allowed disabled:opacity-30",
              "hover:border-slate-300 dark:hover:border-slate-700",
              colors.btn
            )}>
            <Plus className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        </div>
      </div>
    );
  }

  // Simple clean variant (plain number input)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-11 w-full items-center rounded-xl border bg-white px-3 shadow-sm transition-all dark:bg-slate-950",
          colors.border,
          disabled && "cursor-not-allowed opacity-50"
        )}>
        {/* Stepper Down */}
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={stepDown}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 text-slate-500 transition-colors dark:border-slate-800 dark:text-slate-400",
            "disabled:cursor-not-allowed disabled:opacity-30",
            colors.btn
          )}>
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Text Input */}
        <input
          type="number"
          min={min}
          max={max}
          value={raw}
          disabled={disabled}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={() => commit(raw)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(raw);
          }}
          className={cn(
            "text-slate-850 h-full w-full bg-transparent text-center text-base font-bold tabular-nums outline-none focus:outline-none dark:text-white",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
        />

        {/* Stepper Up */}
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={stepUp}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 text-slate-500 transition-colors dark:border-slate-800 dark:text-slate-400",
            "disabled:cursor-not-allowed disabled:opacity-30",
            colors.btn
          )}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
