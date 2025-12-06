import { mutation } from "./_generated/server";
import { v } from "convex/values";



// startSession mutation (runs in default environment, not Node)
export const startSession = mutation({
  args: {
    personaId: v.id("personas"),
    userId: v.id("users"), // STRICT: Must pass userId
  },
  handler: async (ctx, args) => {
    // MODIFIED: Explicitly user userId, no more implicit auth fallback
    const user = await ctx.db.get(args.userId);

    // If user doesn't exist even with fallback token, we should probably auto-create 
    // or tell the client to call 'ensureUser' first. 
    // For simplicity, let's error if not found, implying 'ensureUser' wasn't called.
    if (!user) throw new Error("User not found. Please sign in or init.");

    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");

    const sessionId = await ctx.db.insert("sessions", {
      userId: user._id,
      personaId: persona._id,
      status: "active",
      fundScammed: 0,
      trustLevel: persona.startingTrust,
      startTime: Date.now(),
      messages: [], // Initialize empty messages array
    });

    return sessionId;
  },
});

// buyItem mutation
export const buyItem = mutation({
  args: {
    itemId: v.string(),
    userId: v.optional(v.id("users")), // Allow passing userId explicitly
  },
  handler: async (ctx, args) => {
    let user;

    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else {
      const identity = await ctx.auth.getUserIdentity();
      let tokenIdentifier = identity?.tokenIdentifier;
      if (!tokenIdentifier) tokenIdentifier = "guest_user_123";

      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .unique();
    }

    if (!user) throw new Error("User not found");

    const item = await ctx.db
      .query("items")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .unique();

    if (!item) throw new Error("Item not found");

    if (user.balanceAvailable < item.cost) {
      throw new Error("Insufficient funds");
    }



    await ctx.db.patch(user._id, {
      balanceAvailable: user.balanceAvailable - item.cost,
      inventory: [...user.inventory, item.itemId],
    });

    return { success: true, item };
  },
});

// endSession mutation
export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    finalAmount: v.optional(v.number()), // <--- New Argument
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") return;

    // Use the userId from the session directly
    // This avoids issues where ctx.auth is null (during internal calls or custom auth)
    const user = await ctx.db.get(session.userId);

    if (!user) throw new Error("User not found");

    // ...

    const persona = await ctx.db.get(session.personaId);
    if (!persona) throw new Error("Persona not found");

    let payout = 0;
    let newStatus = "failed";

    if (session.trustLevel > 80) {
      newStatus = "completed";
      // Logic: Use finalAmount if provided and > 0, otherwise maxScamValue
      // But also cap it at maxScamValue to prevent abuse?
      // Or let the user scam MORE if they negotiated well? 
      // Let's cap at maxScamValue unless the AI really messed up.
      // For now: If finalAmount is provided, use it. If it's 0 or null, use maxScamValue.

      const askedAmount = args.finalAmount || 0;
      if (askedAmount > 0) {
        payout = Math.min(askedAmount, persona.maxScamValue); // Cap it at persona limit
      } else {
        payout = persona.maxScamValue; // Default to full wallet
      }

    } else if (session.trustLevel > 50) {
      newStatus = "completed";
      // Partial success logic
      const askedAmount = args.finalAmount || 0;
      if (askedAmount > 0) {
        payout = Math.min(askedAmount, persona.maxScamValue * 0.5);
      } else {
        payout = persona.maxScamValue * (session.trustLevel / 100);
      }
    }

    await ctx.db.patch(args.sessionId, {
      status: newStatus,
      fundScammed: payout,
      endTime: Date.now(),
    });

    // ... (update user balance) ...

    if (payout > 0) {
      await ctx.db.patch(user._id, {
        balanceAvailable: user.balanceAvailable + payout,
        balanceAllTime: user.balanceAllTime + payout,
        stats: {
          wins: user.stats.wins + 1,
          losses: user.stats.losses,
        },
      });
    } else {
      await ctx.db.patch(user._id, {
        stats: {
          wins: user.stats.wins,
          losses: user.stats.losses + 1,
        },
      });
    }

    return { status: newStatus, payout };
  },
});

// Seed Items mutation
export const seedItems = mutation({
  handler: async (ctx) => {
    const items = [
      {
        itemId: "tool_ai_voice",
        name: "AI Voice Generation",
        description: "Clone target's voice for vishing operations. Adds +20 Trust.",
        cost: 500,
        type: "tool",
        assetData: "icon_mic",
      },
      {
        itemId: "tool_otp",
        name: "OTP Interceptor",
        description: "Bypass SMS 2FA protection. Critical for banking access.",
        cost: 800,
        type: "tool",
        assetData: "icon_smartphone",
      },
      {
        itemId: "tool_trojan",
        name: "Trojan PDF",
        description: "Malware hidden in a document. Grants remote access.",
        cost: 300,
        type: "tool",
        assetData: "icon_file",
      },
      {
        itemId: "bait_invoice",
        name: "Overdue Invoice",
        description: "Generic urgency bait. Good for small business targets.",
        cost: 100,
        type: "tool",
        assetData: "icon_alert",
      },
      {
        itemId: "bait_hospital",
        name: "Fake Hospital Bill",
        description: "High-stakes emotional bait. Very effective on elderly.",
        cost: 150,
        type: "tool",
        assetData: "icon_health",
      },
      {
        itemId: "bait_system",
        name: "Fake System Warning",
        description: "Scare tactic for tech support scams.",
        cost: 200,
        type: "tool",
        assetData: "icon_warning",
      }
    ];

    for (const item of items) {
      const existing = await ctx.db
        .query("items")
        .withIndex("by_itemId", (q) => q.eq("itemId", item.itemId))
        .unique();

      if (!existing) {
        await ctx.db.insert("items", item);
      }
    }
  },
});
