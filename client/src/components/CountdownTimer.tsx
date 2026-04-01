import { useEffect, useState } from "react";
import { formatCountdown } from "@/const";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endTime: number;
  className?: string;
  showIcon?: boolean;
}

export function CountdownTimer({ endTime, className, showIcon = true }: CountdownTimerProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const { display, isUrgent, isEnded } = formatCountdown(endTime);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
        isEnded && "text-muted-foreground",
        isUrgent && !isEnded && "text-primary",
        !isUrgent && !isEnded && "text-foreground",
        className
      )}
    >
      {showIcon && <Clock className="h-3.5 w-3.5 shrink-0" />}
      {display}
    </span>
  );
}
