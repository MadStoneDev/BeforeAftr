"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getRating, setRating } from "@/lib/library/ratings";

type Props = {
  path: string | null;
  onRatingChange?: (path: string, rating: number) => void;
};

export function StarRating({ path, onRatingChange }: Props) {
  const [rating, setLocalRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!path) {
      setLocalRating(0);
      return;
    }
    getRating(path).then(setLocalRating);
  }, [path]);

  const handleClick = useCallback(
    (value: number) => {
      if (!path) return;
      const newRating = value === rating ? 0 : value;
      setLocalRating(newRating);
      void setRating(path, newRating);
      onRatingChange?.(path, newRating);
    },
    [path, rating, onRatingChange],
  );

  if (!path) {
    return (
      <p className="text-[10px] text-neutral-600">
        Select a file to rate it.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= (hover || rating);
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/[0.06]"
          >
            <Star
              size={16}
              strokeWidth={1.5}
              className={
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-neutral-600"
              }
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-1 text-[10px] text-neutral-500">
          {rating}/5
        </span>
      )}
    </div>
  );
}
