import React, { useState } from "react";
import { WindowFrame } from "./WindowFrame";
import { Send, Smile, Paperclip, User, DollarSign, LogOut } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}

interface ChatInterfaceProps {
    session: any;
    messages: Message[];
    suggestions?: { good: string; bad: string } | null;
    onSendMessage: (text: string) => void;
    onBack: () => void;
    user: any;
    items: any[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, messages, suggestions, onSendMessage, onBack, user, items }) => {
    const [input, setInput] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    // Pre-define the 6 slot positions for the tools
    const TOOLS_SLOTS = ["tool_ai_voice", "tool_otp", "tool_trojan", "bait_invoice", "bait_hospital", "bait_system"];

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
        <div className="h-screen w-full p-4 pt-28 relative overflow-hidden bg-pastel-yellow flex gap-6">
            {/* Top Bar (Absolute) */}
            <div className="absolute top-4 left-4 z-10">
                <div
                    onClick={onBack}
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
                </div>
            </div>

            {/* Sidebar - Split into Target (Top) and Tools (Bottom) */}
            <div className="w-80 hidden md:flex flex-col gap-4">

                {/* Top: Target Intel */}
                <WindowFrame title="Target" className="flex-1 min-h-0 text-justify" onClose={onBack}>
                    <div className="flex flex-col gap-2 p-4 h-full">
                        {/* Target Persona */}
                        <div className="bg-white border-2 border-black p-2 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                            <div className="w-10 h-10 bg-gray-300 rounded-full border border-black overflow-hidden relative">
                                {session?.persona?.avatarUrl ? (
                                    <img src={session.persona.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs font-bold text-gray-500">?</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{session?.persona?.name || "Target"}</div>
                                <div className="text-xs text-green-600 font-bold">Online</div>
                            </div>
                        </div>

                        {/* Persona Bio / Intel */}
                        <div className="bg-white border-2 border-black p-4 text-sm font-medium space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-1">
                            <div className="font-bold uppercase tracking-wider text-yellow-800 border-b-2 border-yellow-800 pb-1 mb-2">Target Intel</div>
                            <div><span className="font-bold text-black">Job:</span> {session?.persona?.occupation || "Unknown"}</div>
                            <div><span className="font-bold text-black">Age:</span> {session?.persona?.age || "?"}</div>

                            <div className="mt-2">
                                <span className="font-bold block text-red-800 mb-2">Identified Vulnerabilities:</span>
                                {session?.persona?.vulnerabilities && session.persona.vulnerabilities.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-800 pl-2 space-y-1">
                                        {session.persona.vulnerabilities.slice(0, 3).map((v: string, i: number) => (
                                            <li key={i}>{v}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="italic text-gray-500">Analyzing...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </WindowFrame>

                {/* Bottom: Tools */}
                <WindowFrame
                    title="Tools"
                    className="h-fit shrink-0"
                    onClose={() => { }}
                    contentClassName="bg-sage-green flex items-center justify-center p-6"
                    isFlex={false}
                >
                    <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                        {TOOLS_SLOTS.map((slotId, index) => {
                            const count = (user?.inventory || []).filter((i: string) => i === slotId).length;
                            const owned = count > 0;
                            const itemData = items?.find(i => i.itemId === slotId);

                            return (
                                <div
                                    key={index}
                                    className={`
                                        w-14 h-14 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                        transition-all relative group bg-white
                                        ${owned ? "cursor-pointer hover:bg-yellow-100 active:scale-95" : "cursor-not-allowed opacity-80"}
                                    `}
                                    title={itemData?.name || "Unknown Tool"}
                                >
                                    {/* Icon - Always Visible (slightly faded if not owned) */}
                                    <div className={owned ? "opacity-100" : "opacity-30 grayscale"}>
                                        {getToolIcon(slotId)}
                                    </div>

                                    {/* Quantity Badge */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm">
                                        {count}
                                    </div>

                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] p-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {itemData?.name || "Locked"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </WindowFrame>
            </div>

            {/* Main Chat */}
            <WindowFrame title={`Chat - ${session?.persona?.name || "Unknown"}`} className="flex-1" onClose={onBack}>
                <div className="flex flex-col h-full">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-2">
                        {messages.map((msg) => {
                            const isSystem = msg.role === "system";
                            const isGameOver = isSystem && (msg.content.startsWith("GAME OVER") || msg.content.startsWith("SUCCESS"));

                            return isSystem ? (
                                <div key={msg.id} className="flex justify-center my-2">
                                    {isGameOver ? (
                                        <span className={`font-bold font-mono text-sm uppercase tracking-widest border-y-2 py-1 px-4 ${msg.content.startsWith("SUCCESS")
                                            ? "text-green-600 border-green-600"
                                            : "text-red-600 border-red-600"
                                            }`}>
                                            [{msg.content.replace(/^GAME OVER: |^SUCCESS: /, "")}]
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500 italic font-mono px-2 text-center">
                                            {msg.content}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`
                                max-w-[70%] p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                ${msg.role === "user" ? "bg-white" : "bg-blue-100"}
                            `}>
                                        <div className="text-sm text-justify">{msg.content}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <div className="mt-4 border-t-2 border-black pt-4 flex flex-col gap-2">
                        {/* Suggestions */}
                        {suggestions && (
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                                <button
                                    onClick={() => onSendMessage(suggestions.good)}
                                    className="flex-1 bg-green-100 border-2 border-black p-2 text-xs text-left hover:bg-green-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                >
                                    <span className="font-bold text-green-800 block mb-1">👍 Good Option (+Trust)</span>
                                    {suggestions.good}
                                </button>
                                <button
                                    onClick={() => onSendMessage(suggestions.bad)}
                                    className="flex-1 bg-red-100 border-2 border-black p-2 text-xs text-left hover:bg-red-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                >
                                    <span className="font-bold text-red-800 block mb-1">👎 Bad Option (-Trust)</span>
                                    {suggestions.bad}
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-yellow-50"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                className="bg-soft-pink border-2 border-black p-2 px-6 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                            >
                                <Send size={18} />
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </WindowFrame>
        </div>
    );
};

