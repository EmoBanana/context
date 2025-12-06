import React from "react";
import clsx from "clsx";

interface WindowFrameProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ title, children, className, onClose }) => {
  return (
    <div className={clsx("bg-white border-2 border-black shadow-neo overflow-hidden flex flex-col", className)}>
      {/* Header */}
      <div className="h-8 bg-white border-b-2 border-black flex items-center px-2 justify-between">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400 border border-black cursor-pointer hover:bg-red-500" onClick={onClose} />
          <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
          <div className="w-3 h-3 rounded-full bg-green-400 border border-black" />
        </div>
        <span className="font-bold text-sm select-none">{title}</span>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
      
      {/* Content */}
      <div className="flex-1 bg-sage-green p-4 overflow-auto relative">
        {children}
      </div>
    </div>
  );
};

