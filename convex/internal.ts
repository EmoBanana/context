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
    await ctx.db.insert("messages", args);
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

