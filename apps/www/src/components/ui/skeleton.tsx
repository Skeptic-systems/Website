import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  accentColor?: string;
};

export function Skeleton({ className, accentColor }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/50",
        className,
      )}
    >
      <div
        className="animate-shimmer absolute inset-0"
        style={
          accentColor
            ? {
                backgroundImage: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
              }
            : undefined
        }
      />
    </div>
  );
}
