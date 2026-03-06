"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: Date;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endTime: Date): TimeLeft | null {
  const diff = endTime.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({ endTime }: CountdownTimerProps): React.ReactElement {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(endTime)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(endTime);
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <Clock className="h-5 w-5" />
        <span>Deal ended</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Clock className="h-5 w-5 text-red-600" />
      <div className="flex gap-1">
        {[
          { value: timeLeft.hours, label: "hrs" },
          { value: timeLeft.minutes, label: "min" },
          { value: timeLeft.seconds, label: "sec" },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-1">
            {i > 0 && <span className="text-lg font-bold text-gray-400">:</span>}
            <div className="flex flex-col items-center">
              <span className="rounded-md bg-gray-900 px-2 py-1 text-lg font-mono font-bold text-white tabular-nums">
                {pad(unit.value)}
              </span>
              <span className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                {unit.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
