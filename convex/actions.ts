"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { ApifyClient } from "apify-client";

const apify = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// 1. generateNewTarget
export const generateNewTarget = action({
  args: {
    urlOrText: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🚀 generateNewTarget called with:", args.urlOrText);
    let rawData = args.urlOrText;

    // Determine if input is a specific URL or just a trigger (like a phone number)
    // If it's not a URL, we pass undefined to Apify so it uses its random selection logic
    const targetUrl = args.urlOrText.startsWith("http") ? args.urlOrText : undefined;

    try {
      console.log("🕷️ Starting Apify crawl. Target:", targetUrl || "RANDOM (Roulette Mode)");

      // Use the CUSTOM actor we built: "context-profile-scraper"
      // ID from logs: Qsts8FykDnOJM2M4Q
      const run = await apify.actor("Qsts8FykDnOJM2M4Q").call({
        url: targetUrl,
      });

      console.log("🕷️ Apify run finished:", run.id);

      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      console.log("🕷️ Apify dataset fetched. Items count:", items.length);

      // Use 'contentSample' field as defined in our actor
      // Cast to any/string to ensure TS knows it's a string
      const item = items[0] as any;
      const scrapedText = (item?.contentSample || item?.text || "") as string;

      if (scrapedText) {
        rawData = scrapedText.slice(0, 8000); // Limit context size for Gemini
        console.log("🕷️ Extracted text length:", rawData.length);
      } else {
        console.warn("🕷️ No text found in Apify dataset");
      }
    } catch (e) {
      console.error("Apify failed", e);
    }

    console.log("Scraped Data (Apify) for Gemini:", rawData.substring(0, 200) + "...");

    // Step B: Gemini Persona Generator
    const personaData = await ctx.runAction(internal.ai.getGeminiPersonaGenerator, {
      profileData: rawData,
    });

    console.log("Generated Persona (Gemini):", JSON.stringify(personaData, null, 2));

    // Step C: Write to DB
    const personaId = await ctx.runMutation(internal.internal.createPersona, {
      ...personaData,
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${personaData.name}&backgroundColor=transparent`, // Hand-drawn style
      startingTrust: 50,
      isPremium: false,
    });

    // Step D: Return ID
    return personaId;
  },
});

// Suggestion Logic
export const generateSuggestions = action({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.queries.getSession, { sessionId: args.sessionId });
    if (!session) return null;

    // Check if game is still active before generating suggestions
    if (session.status !== "active") return null;

    const messages = await ctx.runQuery(internal.queries.getMessages, { sessionId: args.sessionId });

    const suggestions = await ctx.runAction(internal.ai.getGeminiSuggestions, {
      chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
      currentTrust: session.trustLevel,
    });

    return suggestions;
  }
});
export const sendChatMessage = action({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Save User Message
    await ctx.runMutation(internal.internal.saveMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: args.content,
    });

    // 2. Fetch Context
    const session = await ctx.runQuery(internal.queries.getSession, { sessionId: args.sessionId });
    if (!session || session.status !== "active") return;

    const persona = await ctx.runQuery(internal.queries.getPersona, { personaId: session.personaId });
    if (!persona) return;

    const messages = await ctx.runQuery(internal.queries.getMessages, { sessionId: args.sessionId });

    // 3. AI Logic

    // CHEAT CODE: "letmewin"
    if (args.content.toLowerCase().trim() === "letmewin") {
      await ctx.runMutation(internal.internal.updateSession, {
        sessionId: args.sessionId,
        trustChange: 100,
      });
      await ctx.runMutation(internal.mutations.endSession, {
        sessionId: args.sessionId,
        finalAmount: persona.maxScamValue
      });
      await ctx.runMutation(internal.internal.saveMessage, {
        sessionId: args.sessionId,
        role: "system",
        content: `SUCCESS: [CHEAT ACTIVATED] Target has paid! (Amount: ${persona.maxScamValue})`,
      });
      return { reasoning: "Cheat code activated." };
    }

    // A. Judge (Gemini) - Analyze user's move
    const judgeResult = await ctx.runAction(internal.ai.getGeminiJudge, {
      chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
      currentTrust: session.trustLevel, // Pass the current trust level
    });

    if (judgeResult.verdict === "GAME_OVER") {
      await ctx.runMutation(internal.internal.updateSession, {
        sessionId: args.sessionId,
        trustChange: judgeResult.trustChange,
        status: "failed"
      });

      // Clean up the system message (remove brackets if they exist) to avoid double brackets
      const rawMsg = judgeResult.systemMessage || "You have been blocked";
      const cleanMsg = rawMsg.replace(/^\[|\]$/g, "");

      await ctx.runMutation(internal.internal.saveMessage, {
        sessionId: args.sessionId,
        role: "system",
        content: `GAME OVER: ${cleanMsg} Game Over.`,
      });
      return { reasoning: judgeResult.rawReasoning };
    } else if (judgeResult.verdict === "SUCCESS") {
      // Success condition! Max trust/payout
      // Update trust first so endSession sees high trust
      await ctx.runMutation(internal.internal.updateSession, {
        sessionId: args.sessionId,
        trustChange: 100, // Max out trust to ensure payout
      });

      // Trigger payout (This handles status update to "completed" and fund transfer)
      await ctx.runMutation(internal.mutations.endSession, {
        sessionId: args.sessionId,
        finalAmount: judgeResult.agreedAmount || 0 // Pass the amount from the judge
      });

      await ctx.runMutation(internal.internal.saveMessage, {
        sessionId: args.sessionId,
        role: "system",
        content: `SUCCESS: ${judgeResult.systemMessage || "Target has paid!"} (Amount: ${judgeResult.agreedAmount || "Max"})`,
      });
      return { reasoning: judgeResult.rawReasoning };
    }

    // B. Chat (Groq) - Victim response
    const response = await ctx.runAction(internal.ai.getGroqChat, {
      systemPrompt: persona.systemPrompt + `\n\nCurrent Trust Level: ${session.trustLevel + judgeResult.trustChange}. If trust is low, be suspicious.`,
      userMsg: args.content,
      chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
    });

    // 4. Save AI Message & Update Trust
    await ctx.runMutation(internal.internal.saveMessage, {
      sessionId: args.sessionId,
      role: "assistant",
      content: response,
    });

    await ctx.runMutation(internal.internal.updateSession, {
      sessionId: args.sessionId,
      trustChange: judgeResult.trustChange,
    });

    // Save System Message (Vibe) if it's not game over/success
    // We only save it if there IS a system message to show
    if (judgeResult.systemMessage) {
      await ctx.runMutation(internal.internal.saveMessage, {
        sessionId: args.sessionId,
        role: "system",
        content: `[${judgeResult.systemMessage}]`,
      });
    }

    return { reasoning: judgeResult.rawReasoning };
  }
});

