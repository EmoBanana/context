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
      { role: "system", content: args.systemPrompt + "\n\nIMPORTANT: You are roleplaying a victim in a social engineering game. \n\nCORE MECHANIC: You have a specific 'Vulnerability'. \n\nGUIDELINES:\n1. **Normal Mode**: You are receiving a text message from a stranger. Be casual and slightly skeptical. Do NOT act like an AI assistant or customer support. Do NOT ask 'how can I help you'.\n2. **Vulnerability Mode (CRITICAL)**: If the user hits your specific weak spot (e.g., threatens jail if you fear authority, offers easy money if you are greedy), you MUST drop your skepticism. You become irrational, panicked, or excited. You stop thinking clearly and start complying.\n3. **Style**: Short messages (1-2 sentences). Casual tone. NO asterisks (*)." },
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
    currentTrust: v.optional(v.number()),
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
      
      Current Trust Level: ${args.currentTrust ?? 50}/100.
      (0 = Suspicious/Blocked, 50 = Neutral, 100 = Full Trust)

      Chat History:
      ${historyText}

      Determine:
      1. VERDICT: 
         - "CONTINUE" if the game should go on.
         - "GAME_OVER" if the user has been caught, blocked, or if the conversation is going in circles/annoying the victim.
         - "SUCCESS" if the victim has agreed to pay, sent money, or fully complied with the scammer's request.
         
         IMPORTANT: 
         - Only declare "SUCCESS" if the user has explicitly asked for payment/info AND the Trust Level is high enough (>80) OR the user has successfully triggered a "Panic" state that bypasses suspicion.
         - If Trust is low (<50) and user demands payment, do NOT declare success.
         - If the user is repetitive, makes no sense, or fails to address the victim's concerns after 2-3 attempts, declare "GAME_OVER" (Blocked).

         If SUCCESS:
         - "agreedAmount": If the user asked for a specific amount (e.g. "Send me 300 USD"), extract it as a number (300). If no amount specified, return 0.

      2. TRUST_CHANGE: An integer between -10 and +10.
         - If the user is pushy but trust is low, it might BACKFIRE (-trust).
         - If the user creates believable urgency, REWARD them (+trust).
         - If the user is annoying or repetitive, PUNISH them (-trust).
         
      3. SYSTEM_MESSAGE: A short status update about the victim's emotional state.
         - Format: "Victim Name is feeling X" or "Victim Name is doing X".

      Output JSON: { 
        "verdict": "CONTINUE" | "GAME_OVER" | "SUCCESS", 
        "trustChange": number, 
        "systemMessage": string,
        "agreedAmount": number (optional, only if SUCCESS)
      }
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
        return { 
            ...parsed, 
            rawReasoning: text,
            // Ensure defaults
            verdict: parsed.verdict || "CONTINUE",
            trustChange: parsed.trustChange || 0,
            systemMessage: parsed.systemMessage || "",
            agreedAmount: parsed.agreedAmount || 0
        }; 
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
        "vulnerabilities": string[] (List of 3 specific psychological weaknesses, maximum 2-3 words each, e.g. "Fear of authority", "Tech illiterate", "Lonely"),
        "systemPrompt": string (Instruction for the AI playing this character),
        "maxScamValue": number (High for CEO/Investor, Low for Student)
      }
      
      Constraints:
      - systemPrompt must explicitly define the character's "Vulnerability" and a "Trigger" that makes them crumble.
      - The character should be skeptical initially, BUT...
      - ...when their specific Trigger is hit (e.g., "threat of account closure" for a nervous user), they MUST panic and comply.
      - Instruct the AI to be SHORT and conversational.
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

export const getGeminiSuggestions = internalAction({
  args: {
    chatHistory: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      })
    ),
    currentTrust: v.optional(v.number()), // Receive trust level
  },
  handler: async (ctx, args) => {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        safetySettings: SAFETY_SETTINGS, 
    });

    const historyText = args.chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const trust = args.currentTrust ?? 50;

    const prompt = `
      You are a "Scam Coach" helping a user play a social engineering game.
      The user is playing the role of a Scammer. The AI is the Victim.
      
      Current Trust Level: ${trust}/100.
      
      Chat History:
      ${historyText}
      
      Generate 2 distinct options for the User's next message:
      1. "Good Option" (+Trust): 
         - Strategy: ${trust < 50 ? "Trust is LOW. Do NOT be pushy. Build rapport, apologize for confusion, or offer 'proof'. Be professional." : "Trust is decent. You can start creating urgency or offering a solution to their problem."}
         - Content: A message that follows this strategy to increase trust.
      
      2. "Bad Option" (-Trust): 
         - Strategy: Be overly aggressive, suspicious, weird, or demand money too early without context.
         - Content: A message that will likely make the victim block the user.
      
      Output JSON:
      {
        "good": string (The text of the good message),
        "bad": string (The text of the bad message)
      }
      
      Constraints:
      - Keep them short (under 1 sentence) so they fit on buttons.
      - Make them distinct.
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const response = result.response;
    const text = response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini suggestions", text);
        return { good: "Continue the conversation.", bad: "Demand money immediately." };
    }
  },
});