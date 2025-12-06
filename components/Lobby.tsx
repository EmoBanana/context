import React from "react";
import { WindowFrame } from "./WindowFrame";
import { User, DollarSign, Smartphone, ShoppingBag } from "lucide-react";

interface LobbyProps {
  user: any;
  onStartChat: (id: string) => void;
  onOpenStore: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ user, onStartChat, onOpenStore }) => {
  const phoneNumbers = ["+1 (555) 019-2834", "+1 (555) 938-1203", "+1 (555) 482-9102"];

  return (
    <div className="h-screen w-full p-4 relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white border-2 border-black p-2 px-4 shadow-neo font-bold text-xl rotate-[-2deg]">
            CON//TEXT
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <div className="bg-white border-2 border-black p-2 px-4 shadow-neo flex items-center gap-2">
            <DollarSign size={18} />
            <span className="font-bold font-mono">{user?.balanceAvailable || 0}</span>
        </div>
        <div className="bg-white border-2 border-black p-2 px-4 shadow-neo flex items-center gap-2">
            <User size={18} />
            <span className="font-bold">{user?.username || "Scammer"}</span>
        </div>
      </div>

      {/* Center Content */}
      <div className="flex items-center justify-center h-full">
        <WindowFrame title="Contact List" className="w-[500px] h-[400px]">
            <div className="grid grid-cols-2 gap-4 h-full content-center p-4">
                {phoneNumbers.map((num, i) => (
                    <button 
                        key={i}
                        onClick={() => onStartChat(num)} // Passing number as ID for now, this would normally be a persona ID or trigger generation
                        className="bg-white border-2 border-black p-4 shadow-neo flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <Smartphone size={32} />
                        <span className="font-mono text-sm font-bold">{num}</span>
                        <span className="text-xs text-gray-500">New Lead</span>
                    </button>
                ))}
                
                <button 
                    onClick={onOpenStore}
                    className="bg-soft-pink border-2 border-black p-4 shadow-neo flex flex-col items-center justify-center gap-2 hover:bg-pink-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                    <ShoppingBag size={32} />
                    <span className="font-bold">The Broker</span>
                    <span className="text-xs text-gray-500">Buy Tools</span>
                </button>
            </div>
        </WindowFrame>
      </div>
    </div>
  );
};

