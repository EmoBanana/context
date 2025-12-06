"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Lobby } from "@/components/Lobby";
import { Store } from "@/components/Store";
import { ChatInterface } from "@/components/ChatInterface";
// Note: We skip Convex auth helpers to avoid requiring ConvexProviderWithAuth.

export default function Home() {
  const [view, setView] = useState<"lobby" | "store" | "chat">("lobby");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const isRealApi =
    typeof api?.queries?.getMyUser === "object" &&
    typeof api?.actions?.generateNewTarget === "object" &&
    typeof api?.mutations?.startSession === "object";

  // Safe fallbacks when the Convex client hasn't been generated yet.
  const user = isRealApi ? useQuery(api.queries.getMyUser) : null;
  const items = isRealApi ? useQuery(api.queries.getItems) || [] : [];

  const generateTarget = isRealApi
    ? useAction(api.actions.generateNewTarget)
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

  // Chat Data (Only if in chat)
  const messages =
    isRealApi && activeSessionId
      ? useQuery(api.queries.getMessages, { sessionId: activeSessionId as any }) || []
      : [];
  const session =
    isRealApi && activeSessionId
      ? useQuery(api.queries.getSession, { sessionId: activeSessionId as any })
      : null;

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
        await sendMessage({ sessionId: activeSessionId as any, content: text });
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
              onSendMessage={handleSendMessage} 
              onBack={() => setView("lobby")} 
          />
      )}
    </main>
  );
}
