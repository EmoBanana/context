import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const persona = await ctx.db.get(session.personaId);
    return { ...session, persona };
  },
});

export const getMessages = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.messages) return [];
    
    // Map internal message objects to include an 'id' for the UI
    return session.messages.map((msg: any, index: number) => ({
        ...msg,
        id: `${msg.timestamp}-${index}` // Generate a unique key for React
    }));
  },
});

export const getPersona = internalQuery({
  args: { personaId: v.id("personas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.personaId);
  },
});

// Public queries
export const getMyUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export const getItems = query({
    handler: async (ctx) => {
        return await ctx.db.query("items").collect();
    }
});

