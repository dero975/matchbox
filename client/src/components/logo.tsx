import { Users } from "lucide-react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const sizeClasses = {
    small: {
      container: "flex items-center justify-center gap-1",
      card: "w-8 h-10 p-1",
      lightning: "text-xl",
      icon: "h-3 w-3",
    },
    medium: {
      container: "flex items-center justify-center gap-2",
      card: "w-12 h-16 p-2",
      lightning: "text-3xl",
      icon: "h-4 w-4",
    },
    large: {
      container: "flex items-center justify-center gap-4",
      card: "w-20 h-28 p-4",
      lightning: "text-4xl",
      icon: "h-8 w-8",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`${sizes.container} ${className}`}>
      {/* Left Trading Card */}
      <div className={`bg-white ${sizes.card} rounded-xl transform -rotate-12 shadow-lg border-4 border-primary flex items-center justify-center`}>
        <Users className={`${sizes.icon} text-primary`} />
      </div>
      
      {/* Lightning Bolt */}
      <div className={`lightning-icon ${sizes.lightning} font-bold relative z-10 animate-pulse-glow`}>
        ⚡
      </div>
      
      {/* Right Trading Card */}
      <div className={`bg-white ${sizes.card} rounded-xl transform rotate-12 shadow-lg border-4 border-primary flex items-center justify-center`}>
        <Users className={`${sizes.icon} text-primary`} />
      </div>
    </div>
  );
}
