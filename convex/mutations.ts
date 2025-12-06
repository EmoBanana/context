import { mutation } from "./_generated/server";
import { v } from "convex/values";

// startSession mutation (runs in default environment, not Node)
export const startSession = mutation({
  args: {
    personaId: v.id("personas"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");

    const sessionId = await ctx.db.insert("sessions", {
      userId: user._id,
      personaId: persona._id,
      status: "active",
      fundScammed: 0,
      trustLevel: persona.startingTrust,
      startTime: Date.now(),
    });

    return sessionId;
  },
});

// buyItem mutation
export const buyItem = mutation({
  args: {
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const item = await ctx.db
      .query("items")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .unique();

    if (!item) throw new Error("Item not found");

    if (user.balanceAvailable < item.cost) {
      throw new Error("Insufficient funds");
    }

    if (user.inventory.includes(item.itemId)) {
      throw new Error("Already owned");
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
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") return;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const persona = await ctx.db.get(session.personaId);
    if (!persona) throw new Error("Persona not found");

    let payout = 0;
    let newStatus = "failed";

    if (session.trustLevel > 80) {
      newStatus = "completed";
      payout = persona.maxScamValue;
    } else if (session.trustLevel > 50) {
      newStatus = "completed";
      payout = persona.maxScamValue * (session.trustLevel / 100);
    }

    await ctx.db.patch(args.sessionId, {
      status: newStatus,
      fundScammed: payout,
      endTime: Date.now(),
    });

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

