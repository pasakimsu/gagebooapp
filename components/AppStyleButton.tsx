import React from "react";

interface AppIconButtonProps {
  icon?: string;
  label?: string;
  onClick: () => void;
}

export default function AppIconButton({
  icon = "⚙️",
  label,
  onClick,
}: AppIconButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-[28px] p-[6px] bg-gradient-to-b from-[#e0d4c2] to-[#a89273] shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
        <button
          onClick={onClick}
          className="w-16 h-16 rounded-[20px] bg-gradient-to-b from-[#e5d5bd] to-[#9c7b58]
                     shadow-[0_6px_12px_rgba(0,0,0,0.4),_0_-2px_4px_rgba(255,255,255,0.2)]
                     flex items-center justify-center transition-all duration-200 active:scale-95"
        >
          <span className="text-white text-2xl">{icon}</span>
        </button>
      </div>
      {label && <span className="text-sm text-white/80">{label}</span>}
    </div>
  );
}
