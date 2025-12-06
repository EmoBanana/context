import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    balanceAvailable: v.number(),
    balanceAllTime: v.number(),
    inventory: v.array(v.string()), // Array of item IDs
    stats: v.object({
      wins: v.number(),
      losses: v.number(),
    }),
  }).index("by_token", ["tokenIdentifier"]),

  personas: defineTable({
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
  }),

  items: defineTable({
    itemId: v.string(),
    name: v.string(),
    description: v.string(),
    cost: v.number(),
    type: v.string(), // "tool", "cosmetic", "persona_unlock"
    assetData: v.string(),
  }).index("by_itemId", ["itemId"]),

  sessions: defineTable({
    userId: v.id("users"),
    personaId: v.id("personas"),
    status: v.string(), // "active", "completed", "failed"
    fundScammed: v.number(),
    trustLevel: v.number(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    transcript: v.optional(v.string()), // Readable text format
    messages: v.array(v.object({        // Structured data for UI/AI
      role: v.string(), 
      content: v.string(),
      timestamp: v.number()
    })),
  }).index("by_user_status", ["userId", "status"]),
});

