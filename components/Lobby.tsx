import React, { useState } from "react";
import { WindowFrame } from "./WindowFrame";
import { User, DollarSign, Smartphone, ShoppingBag, LogOut } from "lucide-react";

interface LobbyProps {
    user: any;
    onStartChat: (id: string) => void;
    onOpenStore: () => void;
    onLogout?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ user, onStartChat, onOpenStore, onLogout }) => {
    const [phoneNumbers] = useState(() => {
        return Array(3).fill(null).map(() => {
            const prefix = Math.floor(Math.random() * 10) + 10; // 10-19
            const middle = Math.floor(Math.random() * 900) + 100; // 100-999
            const end = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
            return `+60 ${prefix}-${middle} ${end}`;
        });
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [tutorialMessages, setTutorialMessages] = useState([
        {
            id: 1,
            content: (
                <>
                    Hey <span className="font-bold bg-yellow-200 px-1">{user?.username || "Agent"}</span>, here's 3 new potential targets. I have scoped out their profiles and identified their vulnerabilities. You just gotta apply the pressure. Go get that bag.
                </>
            )
        },
        {
            id: 2,
            content: (
                <>
                    Also, you can contact <span className="font-bold bg-pink-200 px-1">The Broker</span> to purchase some tools to help in your process. That AI Voice Generation tool is a real cheat code!
                </>
            )
        }
    ]);

    const handleStartChat = (num: string) => {
        // Add loading message
        setTutorialMessages(prev => [...prev, {
            id: Date.now(),
            content: <>Alright, sending you the deets...</>
        }]);

        // Small delay to let user see message before switching
        setTimeout(() => {
            onStartChat(num);
        }, 1500);
    };

    return (
        <div className="h-screen w-full p-4 relative overflow-hidden">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 z-10">
                <div className="bg-white border-2 border-black shadow-neo w-48 overflow-hidden">
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
                        <span className="font-bold font-mono">{user?.balanceAvailable || 0}</span>
                    </div>
                </div>

                <div className="relative">
                    {/* Profile Window */}
                    <div
                        onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
                        className="bg-white border-2 border-black shadow-neo overflow-hidden min-w-[140px]"
                    >
                        <div className="bg-gray-100 border-b-2 border-black p-1.5 flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full border border-black bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full border border-black bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full border border-black bg-green-400" />
                            <div className="flex-1 text-[10px] font-mono leading-none text-center opacity-50 select-none">Username.txt</div>
                        </div>
                        <div className="p-2 px-4 flex items-center justify-center gap-2">
                            <User size={18} />
                            <span className="font-bold">{user?.username || "Scammer"}</span>
                        </div>
                    </div>

                    {/* Logout Popup */}
                    {showLogoutConfirm && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-white border-2 border-black shadow-neo z-50">
                            <button
                                onClick={() => {
                                    if (onLogout) onLogout();
                                    setShowLogoutConfirm(false);
                                }}
                                className="w-full p-2 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 justify-center"
                            >
                                <LogOut size={14} />
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Content */}
            <div className="flex items-center justify-center h-full">
                <WindowFrame title="Contact List" className="w-[1000px] h-[600px]" contentClassName="p-0 bg-white">
                    <div className="flex h-full font-mono">
                        {/* Sidebar */}
                        <div className="w-1/3 border-r-2 border-black bg-gray-50 flex flex-col overflow-y-auto">
                            <div className="h-14 border-b-2 border-black bg-gray-200 flex items-center px-4 font-bold text-xs uppercase tracking-wider shrink-0">
                                Active Lines
                            </div>
                            {phoneNumbers.map((num, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleStartChat(num)}
                                    className="p-4 border-b-2 border-black hover:bg-yellow-50 text-left group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white border-2 border-black p-1.5 rounded-full group-hover:scale-110 transition-transform">
                                            <Smartphone size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{num}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase">New Lead</div>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <div className="mt-auto">
                                <button
                                    onClick={onOpenStore}
                                    className="w-full h-20 p-4 border-t-2 border-black bg-soft-pink hover:bg-pink-100 text-left group transition-all flex items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white border-2 border-black p-1.5 rounded-full group-hover:scale-110 transition-transform">
                                            <ShoppingBag size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">The Broker</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase">Buy Tools</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Main Chat Area (Tutorial) */}
                        <div className="flex-1 bg-white flex flex-col relative">
                            {/* Chat Header */}
                            <div className="h-14 border-b-2 border-black bg-gray-50 flex items-center px-4 justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-bold text-sm">Operator</span>
                                </div>
                                <span className="text-xs text-gray-400 font-bold">ENCRYPTED</span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-sage-green/20">
                                {tutorialMessages.map((msg) => (
                                    <div key={msg.id} className="flex flex-col gap-1 max-w-[80%]">
                                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-tr-lg rounded-bl-lg rounded-br-lg">
                                            <p className="text-base text-justify">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Fake Input Area */}
                            <div className="h-20 p-4 border-t-2 border-black bg-gray-50 flex items-center">
                                <div className="w-full bg-white border-2 border-black h-12 px-4 flex items-center text-gray-400 text-sm font-mono cursor-not-allowed italic">
                                    Reply restricted to secure channels...
                                </div>
                            </div>
                        </div>
                    </div>
                </WindowFrame>
            </div>
        </div >
    );
};

