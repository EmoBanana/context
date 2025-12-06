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
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, messages, onSendMessage, onBack }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* Sidebar - Buddies */}
      <WindowFrame title="Buddies" className="w-64 hidden md:flex" onClose={onBack}>
        <div className="flex flex-col gap-2">
            <div className="bg-white border-2 border-black p-2 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-8 h-8 bg-gray-300 rounded-full border border-black overflow-hidden">
                    {/* Avatar */}
                </div>
                <div>
                    <div className="font-bold text-sm">Target</div>
                    <div className="text-xs text-green-600 font-bold">Online</div>
                </div>
            </div>
            {/* More buddies */}
        </div>
      </WindowFrame>

      {/* Main Chat */}
      <WindowFrame title={`Chat - ${session?.persona?.name || "Unknown"}`} className="flex-1" onClose={onBack}>
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-2">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`
                            max-w-[70%] p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            ${msg.role === "user" ? "bg-white" : "bg-blue-100"}
                        `}>
                            <div className="text-sm">{msg.content}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="mt-4 border-t-2 border-black pt-4 flex gap-2">
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
      </WindowFrame>
    </div>
  );
};

