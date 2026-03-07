"use client";

import { useState, useCallback } from "react";
import { RATING_MAX } from "@amazone/shared-utils";
import { Star } from "lucide-react";

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps): React.ReactElement {
  const [hoveredStar, setHoveredStar] = useState(0);

  const displayRating = hoveredStar || value;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, star: number) => {
      if (disabled) return;

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = Math.min(star + 1, RATING_MAX);
        onChange(next);
        // Focus the next star button
        const nextButton = (event.currentTarget.parentElement?.children[next - 1]) as HTMLButtonElement | undefined;
        nextButton?.focus();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        const prev = Math.max(star - 1, 1);
        onChange(prev);
        const prevButton = (event.currentTarget.parentElement?.children[prev - 1]) as HTMLButtonElement | undefined;
        prevButton?.focus();
      }
    },
    [disabled, onChange]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Rating"
      >
        {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""} - ${ratingLabels[star]}`}
            tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
            disabled={disabled}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onKeyDown={(e) => handleKeyDown(e, star)}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {ratingLabels[displayRating]}
          </span>
        )}
      </div>
    </div>
  );
}
