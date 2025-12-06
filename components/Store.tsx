import React from "react";
import { WindowFrame } from "./WindowFrame";
import { ShoppingCart } from "lucide-react";

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
}

export const Store: React.FC<StoreProps> = ({ items, onBuy, onClose, userBalance }) => {
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <WindowFrame title="The Broker - Black Market" className="w-[800px] h-[600px]" onClose={onClose}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
                <div key={item._id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-48">
                    <div>
                        <div className="font-bold text-lg mb-1">{item.name}</div>
                        <div className="text-sm text-gray-600 leading-tight">{item.description}</div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
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
            ))}
        </div>
      </WindowFrame>
    </div>
  );
};

