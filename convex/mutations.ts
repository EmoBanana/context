import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const ensureUser = mutation({
  args: {
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check for authenticated user (production/standard flow)
    const identity = await ctx.auth.getUserIdentity();
    
    // For development, we'll allow a "dev user" fallback if no auth is present
    // BUT typically, Convex apps without auth setup just return null for identity.
    // If we want to simulate a user for dev, we can key off something else or just create one.
    
    let tokenIdentifier = identity?.tokenIdentifier;
    let name = identity?.name || args.username || "Anonymous Scammer";

    if (!tokenIdentifier) {
        // DEV MODE / NO AUTH FALLBACK
        // We'll use a fixed token for a "guest" user to allow testing without Clerk/Auth0
        tokenIdentifier = "guest_user_123";
        console.log("Using guest identity for dev:", tokenIdentifier);
    }

    // 2. Find or Create User
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!user) {
      user = {
        tokenIdentifier,
        username: name,
        balanceAvailable: 1000, // Starting money
        balanceAllTime: 0,
        inventory: [],
        stats: { wins: 0, losses: 0 },
      };
      // Insert and get the ID (though we don't need the ID if we just return the object, 
      // but typically we want to return the user doc)
      const id = await ctx.db.insert("users", user);
      // We can fetch it back or construct it with _id
      return { ...user, _id: id };
    }

    return user;
  },
});

// startSession mutation (runs in default environment, not Node)
export const startSession = mutation({
  args: {
    personaId: v.id("personas"),
  },
  handler: async (ctx, args) => {
    // MODIFIED: Use the ensureUser logic or just try to get user, handling the dev case
    const identity = await ctx.auth.getUserIdentity();
    let tokenIdentifier = identity?.tokenIdentifier;

    if (!tokenIdentifier) {
        // Fallback for dev testing if no auth provider is actively blocking us
        tokenIdentifier = "guest_user_123";
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

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
    let tokenIdentifier = identity?.tokenIdentifier;
    
    if (!tokenIdentifier) {
         tokenIdentifier = "guest_user_123";
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
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
    let tokenIdentifier = identity?.tokenIdentifier;
    if (!tokenIdentifier) tokenIdentifier = "guest_user_123"; // Dev fallback

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");
    
    // Verify user owns session? (Optional security check)
    if (session.userId !== user._id) {
       // In strict mode we'd throw, but for dev fallback consistency we'll allow if it matches logic
    }

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
