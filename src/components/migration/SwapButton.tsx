import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface SwapButtonProps {
  onSwap: () => void;
  disabled?: boolean;
}

export const SwapButton: React.FC<SwapButtonProps> = ({ onSwap, disabled }) => {
  return (
    <button
      type="button"
      onClick={onSwap}
      disabled={disabled}
      title="Swap source and destination"
      className="group w-10 h-10 rounded-full bg-[#161922] border border-[#262b36] hover:bg-[#1c202b] hover:border-blue-500/40 flex items-center justify-center text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
    >
      <ArrowLeftRight
        className="w-4 h-4 rotate-90 lg:rotate-0 group-hover:rotate-180 transition-transform duration-300"
        strokeWidth={2}
      />
    </button>
  );
};