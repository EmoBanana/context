"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Lobby } from "@/components/Lobby";
import { Store } from "@/components/Store";
import { ChatInterface } from "@/components/ChatInterface";
// ... imports
import { NeoBrutalismAuth } from "@/components/NeoBrutalismAuth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<"lobby" | "store" | "chat">("lobby");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ good: string, bad: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isRealApi =
    typeof api?.queries?.getMyUser === "object" &&
    typeof api?.actions?.generateNewTarget === "object" &&
    typeof api?.mutations?.startSession === "object";

  // Safe fallbacks when the Convex client hasn't been generated yet.
  const userQuery = useQuery(api.queries.getUser, currentUser ? { userId: currentUser._id } : "skip");

  // Prioritize the live query result if available, otherwise fallback to the snapshot
  const user = userQuery || currentUser;

  /* 
   * FALLBACK ITEMS (Client-side)
   * Used when the database is empty or connection fails.
   */
  const FALLBACK_ITEMS = [
    {
      _id: "client_1",
      itemId: "tool_ai_voice",
      name: "AI Voice Generation",
      description: "Clone target's voice for vishing operations. Adds +20 Trust.",
      cost: 500,
      type: "tool"
    },
    {
      _id: "client_2",
      itemId: "tool_otp",
      name: "OTP Interceptor",
      description: "Bypass SMS 2FA protection. Critical for banking access.",
      cost: 800,
      type: "tool"
    },
    {
      _id: "client_3",
      itemId: "tool_trojan",
      name: "Trojan PDF",
      description: "Malware hidden in a document. Grants remote access.",
      cost: 300,
      type: "tool"
    },
    {
      _id: "client_4",
      itemId: "bait_invoice",
      name: "Overdue Invoice",
      description: "Generic urgency bait. Good for small business targets.",
      cost: 100,
      type: "tool"
    },
    {
      _id: "client_5",
      itemId: "bait_hospital",
      name: "Fake Hospital Bill",
      description: "High-stakes emotional bait. Very effective on elderly.",
      cost: 150,
      type: "tool"
    },
    {
      _id: "client_6",
      itemId: "bait_system",
      name: "Fake System Warning",
      description: "Scare tactic for tech support scams.",
      cost: 200,
      type: "tool"
    }
  ];

  const itemsQuery = useQuery(api.queries.getItems, isRealApi ? {} : "skip");
  const items = (itemsQuery && itemsQuery.length > 0) ? itemsQuery : FALLBACK_ITEMS;


  const seedItems = isRealApi ? useMutation(api.mutations.seedItems) : async () => null;

  // Auto-seed items
  useEffect(() => {
    if (isRealApi && seedItems) {
      seedItems();
    }
  }, [isRealApi]);

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
      const personaId = await generateTarget({ urlOrText });
      const sessionId = await startSession({ personaId: personaId as any, userId: user._id });
      setActiveSessionId(sessionId);
      setView("chat");
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  const handleBuy = async (itemId: string) => {
    await buyItem({ itemId, userId: user?._id });
  };

  const handleSendMessage = async (text: string) => {
    if (activeSessionId) {
      setSuggestions(null); // Clear previous suggestions
      const result = await sendMessage({ sessionId: activeSessionId as any, content: text });
      if (result && result.reasoning) {
        console.log("🤖 AI Reasoning:", result.reasoning);
      }
      generateSuggestions({ sessionId: activeSessionId as any })
        .then((s) => setSuggestions(s as any))
        .catch((e) => console.error("Failed to generate suggestions", e));
    }
  };

  if (!isAuthenticated) {
    return <NeoBrutalismAuth onLogin={(user) => {
      setIsAuthenticated(true);
      if (user) {
        setCurrentUser(user);
      }
    }} />;
  }

  return (
    <main className="min-h-screen bg-pastel-yellow font-sans">
      {view === "lobby" && (
        <Lobby
          user={user}
          onStartChat={handleStartChat}
          onOpenStore={() => setView("store")}
          onLogout={() => {
            setIsAuthenticated(false);
            setCurrentUser(null);
          }}
        />
      )}

      {view === "store" && (
        <Store
          items={items}
          userBalance={user?.balanceAvailable || 0}
          onBuy={handleBuy}
          onClose={() => setView("lobby")}
          inventory={user?.inventory || []}
          username={user?.username}
        />
      )}

      {view === "chat" && (
        <ChatInterface
          session={session}
          messages={messages as any}
          // suggestions={suggestions} // Disabled for demo
          onSendMessage={handleSendMessage}
          onBack={() => setView("lobby")}
          user={user}
          items={items}
        />
      )}
    </main>
  );
}

