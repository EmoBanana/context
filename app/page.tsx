"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Lobby } from "@/components/Lobby";
import { Store } from "@/components/Store";
import { ChatInterface } from "@/components/ChatInterface";
// Note: We skip Convex auth helpers to avoid requiring ConvexProviderWithAuth.

export default function Home() {
  const [view, setView] = useState<"lobby" | "store" | "chat">("lobby");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{good: string, bad: string} | null>(null);

  const isRealApi =
    typeof api?.queries?.getMyUser === "object" &&
    typeof api?.actions?.generateNewTarget === "object" &&
    typeof api?.mutations?.startSession === "object";

  // Safe fallbacks when the Convex client hasn't been generated yet.
  const user = useQuery(api.queries.getMyUser, isRealApi ? {} : "skip");
  const items = useQuery(api.queries.getItems, isRealApi ? {} : "skip") || [];
  
  const ensureUser = isRealApi ? useMutation(api.mutations.ensureUser) : async () => null;

  // Auto-init user for dev
  useEffect(() => {
    if (isRealApi && ensureUser) {
        ensureUser({ username: "Scammer" }).catch(e => console.error("Auto-user init failed", e));
    }
  }, [isRealApi]); // Run once when API is ready

  const generateTarget = isRealApi
    ? useAction(api.actions.generateNewTarget)
    : async () => null;
  const generateSuggestions = isRealApi
    ? useAction(api.actions.generateSuggestions)
    : async () => null;
  const startSession = isRealApi
    ? useMutation(api.mutations.startSession)
    : async () => null;
  const buyItem = isRealApi
    ? useMutation(api.mutations.buyItem)
    : async () => ({ success: false });
  const sendMessage = isRealApi
    ? useAction(api.actions.sendChatMessage)
    : async () => null;

  // Chat Data (Unconditional hooks with skip pattern)
  const messages = useQuery(api.queries.getMessages, 
    (isRealApi && activeSessionId) ? { sessionId: activeSessionId as any } : "skip"
  ) || [];
  
  const session = useQuery(api.queries.getSession, 
    (isRealApi && activeSessionId) ? { sessionId: activeSessionId as any } : "skip"
  );

  // Handlers
  const handleStartChat = async (urlOrText: string) => {
    try {
        console.log("Generating target...");
        // In a real game, this might take time, so we should show loading
        const personaId = await generateTarget({ urlOrText });
        const sessionId = await startSession({ personaId: personaId as any });
        setActiveSessionId(sessionId);
        setView("chat");
    } catch (e) {
        console.error("Failed to start chat", e);
    }
  };

  const handleBuy = async (itemId: string) => {
    await buyItem({ itemId });
  };

  const handleSendMessage = async (text: string) => {
    if (activeSessionId) {
        setSuggestions(null); // Clear previous suggestions
        const result = await sendMessage({ sessionId: activeSessionId as any, content: text });
        if (result && result.reasoning) {
            console.log("🤖 AI Reasoning:", result.reasoning);
        }
        // Generate new suggestions after AI replies
        // We catch error so it doesn't break the flow if suggestions fail
        generateSuggestions({ sessionId: activeSessionId as any })
            .then((s) => setSuggestions(s as any))
            .catch((e) => console.error("Failed to generate suggestions", e));
    }
  };

  return (
    <main className="min-h-screen bg-pastel-yellow font-sans">
      {view === "lobby" && (
          <Lobby 
              user={user} 
              onStartChat={handleStartChat} 
              onOpenStore={() => setView("store")} 
          />
      )}

      {view === "store" && (
          <Store 
              items={items} 
              userBalance={user?.balanceAvailable || 0} 
              onBuy={handleBuy} 
              onClose={() => setView("lobby")} 
          />
      )}

      {view === "chat" && (
          <ChatInterface 
              session={session} 
              messages={messages as any} 
              // suggestions={suggestions} // Disabled for demo
              onSendMessage={handleSendMessage} 
              onBack={() => setView("lobby")} 
          />
      )}
    </main>
  );
}
