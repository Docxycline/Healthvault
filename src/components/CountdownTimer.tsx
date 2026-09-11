import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  showSeconds?: boolean;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  showSeconds = true,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(expiresAt).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        Expired (0h 0m)
      </span>
    );
  }

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 60;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${
        isUrgent
          ? 'bg-amber-50 text-amber-800 border border-amber-200'
          : 'bg-blue-50 text-blue-800 border border-blue-200'
      } ${className}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600 animate-pulse' : 'text-blue-600'}`} />
      <span>
        {timeLeft.hours}h {timeLeft.minutes}m {showSeconds && `${timeLeft.seconds}s`}
      </span>
    </span>
  );
};
