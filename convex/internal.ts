import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createPersona = internalMutation({
  args: {
    name: v.string(),
    age: v.number(),
    occupation: v.string(),
    avatarUrl: v.string(),
    bio: v.string(),
    systemPrompt: v.string(),
    maxScamValue: v.number(),
    startingTrust: v.number(),
    isPremium: v.boolean(),
    vulnerabilities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("personas", args);
  },
});

export const saveMessage = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // 1. Prepare new message object
    const newMessage = {
        role: args.role,
        content: args.content,
        timestamp: Date.now()
    };

    // 2. Prepare transcript line
    let speakerName = "User";
    if (args.role === "assistant") {
        const persona = await ctx.db.get(session.personaId);
        speakerName = persona?.name || "Target";
    } else if (args.role === "system") {
        speakerName = "System";
    }
    const newLine = `${speakerName}: ${args.content}`;
    const currentTranscript = session.transcript || "";
    const newTranscript = currentTranscript ? `${currentTranscript}\n\n${newLine}` : newLine;

    // 3. Update Session with BOTH
    await ctx.db.patch(args.sessionId, {
        messages: [...(session.messages || []), newMessage],
        transcript: newTranscript
    });
  },
});

export const updateSession = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    trustChange: v.number(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const newTrust = Math.min(100, Math.max(0, session.trustLevel + args.trustChange));
    
    const updates: any = { trustLevel: newTrust };
    if (args.status) updates.status = args.status;

    await ctx.db.patch(args.sessionId, updates);
  },
});

