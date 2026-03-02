"use client";

import { useState } from "react";

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: { button: "h-7 w-7 text-sm", display: "h-7 w-10 text-sm" },
  md: { button: "h-9 w-9 text-base", display: "h-9 w-12 text-base" },
} as const;

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = "md",
}: QuantitySelectorProps): React.ReactElement {
  const styles = sizeStyles[size];

  return (
    <div className="inline-flex items-center rounded-md border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={`${styles.button} flex items-center justify-center rounded-l-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`${styles.display} flex items-center justify-center border-x font-medium tabular-nums`}
        aria-label={`Quantity: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={`${styles.button} flex items-center justify-center rounded-r-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
