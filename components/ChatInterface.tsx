import React, { useState } from "react";
import { WindowFrame } from "./WindowFrame";
import { Send, Smile, Paperclip } from "lucide-react";

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
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, messages, suggestions, onSendMessage, onBack }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* Sidebar - Target */}
      <WindowFrame title="Target" className="w-64 hidden md:flex" onClose={onBack}>
        <div className="flex flex-col gap-2">
            {/* Target Persona */}
            <div className="bg-white border-2 border-black p-2 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-10 h-10 bg-gray-300 rounded-full border border-black overflow-hidden">
                    {session?.persona?.avatarUrl && <img src={session.persona.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{session?.persona?.name || "Target"}</div>
                    <div className="text-xs text-green-600 font-bold">Online</div>
                </div>
            </div>
            
            {/* Persona Bio / Intel */}
            <div className="bg-white border-2 border-black p-2 text-sm space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="font-bold uppercase tracking-wider text-yellow-800 border-b border-yellow-800 mb-1">Target Intel</div>
                <div><span className="font-bold">Job:</span> {session?.persona?.occupation || "Unknown"}</div>
                <div><span className="font-bold">Age:</span> {session?.persona?.age || "?"}</div>
                
                <div className="mt-2">
                    <span className="font-bold block text-red-800 mb-1">Identified Vulnerabilities:</span>
                    {session?.persona?.vulnerabilities && session.persona.vulnerabilities.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-700 pl-1">
                            {session.persona.vulnerabilities.slice(0, 3).map((v: string, i: number) => (
                                <li key={i}>{v}</li>
                            ))}
                        </ul>
                    ) : (
                        <div className="italic text-gray-500">Analyzing...</div>
                    )}
                </div>
            </div>

            {/* Victim Mood / State - REMOVED from sidebar */}
        </div>
      </WindowFrame>

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
                                <span className={`font-bold font-mono text-sm uppercase tracking-widest border-y-2 py-1 px-4 ${
                                    msg.content.startsWith("SUCCESS") 
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
                                <div className="text-sm">{msg.content}</div>
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

