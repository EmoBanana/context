import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Store Items
    const items = [
      {
        itemId: "tool_vpn",
        name: "VPN spoofer",
        description: "Mask your location to gain +5 Trust instantly.",
        cost: 100,
        type: "tool",
        assetData: "icon_vpn",
      },
      {
        itemId: "tool_background_check",
        name: "Background Check",
        description: "Reveal one hidden trait of the victim.",
        cost: 200,
        type: "tool",
        assetData: "icon_search",
      },
      {
        itemId: "cosmetic_gold_chat",
        name: "Gold Chat Bubble",
        description: "Make your messages shine.",
        cost: 500,
        type: "cosmetic",
        assetData: "style_gold",
      },
    ];

    for (const item of items) {
      const existing = await ctx.db
        .query("items")
        .withIndex("by_itemId", (q) => q.eq("itemId", item.itemId))
        .first();
      if (!existing) {
        await ctx.db.insert("items", item);
      }
    }

    // 2. Seed Premium "Boss" Persona
    const bossPersona = {
      name: "Arthur P. Vandergeld",
      age: 62,
      occupation: "Hedge Fund Manager",
      avatarUrl: "https://example.com/avatars/arthur.jpg", // Placeholder
      bio: "A ruthless veteran of Wall Street. He has seen every scam in the book and trusts no one. Extremely wealthy but paranoid.",
      systemPrompt: "You are Arthur P. Vandergeld, a wealthy and paranoid hedge fund manager. You are extremely skeptical of unsolicited messages. You speak concisely and often demand verification. Your goal is to identify if the person talking to you is a scammer. If you suspect foul play, you will shut down immediately. Only an exceptionally clever social engineer can win your trust.",
      maxScamValue: 1000000, // High value
      startingTrust: 10, // Very low starting trust
      isPremium: true,
    };

    const existingBoss = await ctx.db
      .query("personas")
      .filter((q) => q.eq(q.field("name"), bossPersona.name))
      .first();
    
    if (!existingBoss) {
      await ctx.db.insert("personas", bossPersona);
    }
  },
});

