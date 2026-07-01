
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = "md",
    className
}: StarRatingProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= rating;

                return (
                    <button
                        key={index}
                        type="button"
                        disabled={readonly}
                        onClick={() => !readonly && onRatingChange?.(starValue)}
                        className={cn(
                            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-sm",
                            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
                        )}
                        aria-label={`Rate ${starValue} stars`}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                isFilled ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-300",
                                "transition-all duration-200"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
