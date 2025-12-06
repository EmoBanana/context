import React from "react";
import { WindowFrame } from "./WindowFrame";
import { ShoppingCart, User, DollarSign } from "lucide-react";

interface Item {
  _id: string;
  itemId: string;
  name: string;
  description: string;
  cost: number;
}

interface StoreProps {
  items: Item[];
  onBuy: (itemId: string) => void;
  onClose: () => void;
  userBalance: number;
  inventory: string[];
  username: string;
}

export const Store: React.FC<StoreProps> = ({ items, onBuy, onClose, userBalance, inventory = [], username }) => {
  const getToolIcon = (itemId: string) => {
    // Simple mapping for visual representation in the grid
    switch (itemId) {
      case "tool_ai_voice": return <span className="text-xl">🎙️</span>;
      case "tool_otp": return <span className="text-xl">📱</span>;
      case "tool_trojan": return <span className="text-xl">👾</span>;
      case "bait_invoice": return <span className="text-xl">📄</span>;
      case "bait_hospital": return <span className="text-xl">🏥</span>;
      case "bait_system": return <span className="text-xl">⚠️</span>;
      default: return <span className="text-xl">❓</span>;
    }
  };

  return (
    <div className="h-screen w-full relative bg-pastel-yellow overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Top Bar (Absolute) */}
      <div className="absolute top-4 left-4 z-10">
        <div
          onClick={onClose}
          className="bg-white border-2 border-black shadow-neo w-48 overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform"
        >
          <div className="bg-gray-100 border-b-2 border-black p-1.5 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-black bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full border border-black bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full border border-black bg-green-400" />
            <div className="flex-1 text-[10px] font-mono leading-none text-center opacity-50 select-none">GameTitle.txt</div>
          </div>
          <div className="p-3 font-black text-xl text-center italic tracking-tighter">
            CON//TEXT
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-4">
        {/* Balance Window */}
        <div className="bg-white border-2 border-black shadow-neo overflow-hidden min-w-[140px]">
          <div className="bg-gray-100 border-b-2 border-black p-1.5 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-black bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full border border-black bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full border border-black bg-green-400" />
            <div className="flex-1 text-[10px] font-mono leading-none text-center opacity-50 select-none">Balance.txt</div>
          </div>
          <div className="p-2 px-4 flex items-center justify-center gap-2">
            <DollarSign size={18} />
            <span className="font-bold font-mono">{userBalance}</span>
          </div>
        </div>

        <div className="relative">
          {/* Profile Window */}
          <div className="bg-white border-2 border-black shadow-neo overflow-hidden min-w-[140px]">
            <div className="bg-gray-100 border-b-2 border-black p-1.5 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-black bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full border border-black bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full border border-black bg-green-400" />
              <div className="flex-1 text-[10px] font-mono leading-none text-center opacity-50 select-none">Username.txt</div>
            </div>
            <div className="p-2 px-4 flex items-center justify-center gap-2">
              <User size={18} />
              <span className="font-bold">{username || "Scammer"}</span>
            </div>
          </div>
        </div>
      </div>

      <WindowFrame title="The Broker - Black Market" className="w-[800px] h-[600px] mt-16" onClose={onClose}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const count = inventory.filter(i => i === item.itemId).length;

            return (
              <div key={item._id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-48">
                {/* Header: Title + Icon */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="font-bold text-lg leading-tight">{item.name}</div>

                  {/* Tool Icon */}
                  <div className="w-12 h-12 shrink-0 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white relative">
                    {getToolIcon(item.itemId)}
                    {/* Quantity Badge */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm">
                      {count}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm text-gray-600 leading-tight text-justify flex-1 overflow-hidden">
                  {item.description}
                </div>

                {/* Footer: Cost + Buy */}
                <div className="mt-2 flex items-center justify-between shrink-0">
                  <div className="font-mono font-bold text-green-700">${item.cost}</div>
                  <button
                    onClick={() => onBuy(item.itemId)}
                    disabled={userBalance < item.cost}
                    className={`border-2 border-black p-2 px-3 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 transition-all
                                    ${userBalance >= item.cost
                        ? "bg-pastel-yellow hover:bg-yellow-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        : "bg-gray-200 opacity-50 cursor-not-allowed"}
                                `}
                  >
                    <ShoppingCart size={14} />
                    Buy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </WindowFrame>
    </div>
  );
};

