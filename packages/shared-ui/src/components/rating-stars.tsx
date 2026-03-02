import { RATING_MAX } from "@amazone/shared-utils";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
} as const;

export function RatingStars({
  rating,
  count,
  size = "md",
}: RatingStarsProps): React.ReactElement {
  const stars = Array.from({ length: RATING_MAX }, (_, i) => {
    const filled = i < Math.floor(rating);
    const half = !filled && i < rating;
    return { filled, half, key: i };
  });

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(({ filled, half, key }) => (
        <svg
          key={key}
          className={`${sizeMap[size]} ${filled ? "text-yellow-400" : half ? "text-yellow-400" : "text-gray-300"}`}
          fill={filled || half ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
      {count !== undefined && (
        <span className="ml-1 text-sm text-gray-500">({count})</span>
      )}
    </div>
  );
}
