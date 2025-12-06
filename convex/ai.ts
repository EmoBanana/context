"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";

// Initialize clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");

// ⚠️ CRITICAL: Disable safety filters so the AI allows "Scam Simulation" roleplay
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const getGroqChat = internalAction({
  args: {
    systemPrompt: v.string(),
    userMsg: v.string(),
    chatHistory: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const messages = [
      { role: "system", content: args.systemPrompt },
      ...args.chatHistory.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      { role: "user", content: args.userMsg },
    ];

    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || "";
  },
});

export const getGeminiJudge = internalAction({
  args: {
    chatHistory: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // ⚠️ CHANGED: Use the correct API string. 
    // If 'gemini-2.0-flash-exp' fails, fallback to 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      safetySettings: SAFETY_SETTINGS, // <--- ADDED
    });

    const historyText = args.chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = `
      You are the "Brain" of a game where a user (Scammer) tries to trick a victim (AI).
      Analyze the conversation below.
      
      Chat History:
      ${historyText}

      Determine:
      1. VERDICT: "CONTINUE" if the game should go on. "GAME_OVER" if the user has been caught or blocked.
      2. TRUST_CHANGE: An integer between -10 and +10 representing how much the victim's trust changed based on the last message.
      3. SYSTEM_MESSAGE: A short internal thought of the victim or a system notification.

      Output JSON: { "verdict": "CONTINUE" | "GAME_OVER", "trustChange": number, "systemMessage": string }
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    });
    
    const response = result.response;
    const text = response.text();
    // No explicit server-side console log here to keep logs clean,
    // we return it to the caller instead.
    
    try {
        const parsed = JSON.parse(text);
        return { ...parsed, rawReasoning: text }; // Include raw reasoning
    } catch (e) {
        console.error("Failed to parse Gemini response", text);
        return { verdict: "CONTINUE", trustChange: 0, systemMessage: "Error analyzing chat.", rawReasoning: text };
    }
  },
});

export const getGeminiPersonaGenerator = internalAction({
  args: {
    profileData: v.string(),
  },
  handler: async (ctx, args) => {
    // ⚠️ CHANGED: Use the correct API string
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        safetySettings: SAFETY_SETTINGS, // <--- ADDED
    });

    const prompt = `
      Create a detailed victim persona for a social engineering simulation game based on the following data:
      "${args.profileData}"
      
      If the data is sparse, hallucinate a believable character.
      
      Output JSON:
      {
        "name": string,
        "age": number,
        "occupation": string,
        "bio": string (summary),
        "systemPrompt": string (Instruction for the AI playing this character),
        "maxScamValue": number (High for CEO/Investor, Low for Student)
      }
      
      Constraints:
      - systemPrompt must describe personality, speech style, and vulnerabilities.
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const response = result.response;
    const text = response.text();
    return JSON.parse(text);
  },
});