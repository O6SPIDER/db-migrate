import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SwapButtonProps {
  onSwap: () => void;
  disabled?: boolean;
}

export const SwapButton: React.FC<SwapButtonProps> = ({ onSwap, disabled }) => {
  return (
    <div className="flex justify-center my-[-8px] relative z-10">
      <button
        type="button"
        onClick={onSwap}
        disabled={disabled}
        className="px-4 py-2 rounded-full bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-300 hover:text-white text-xs font-mono flex items-center space-x-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed group"
        title="Swap Source and Destination URLs"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-180 transition-transform duration-300" />
        <span>Swap Databases</span>
      </button>
    </div>
  );
};
