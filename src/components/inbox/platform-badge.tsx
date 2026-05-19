import { cn, platformColors } from "@/lib/utils";
import type { Platform } from "@/types";

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
        platformColors[platform],
        className
      )}
    >
      {platform}
    </span>
  );
}
