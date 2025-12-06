import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const register = mutation({
    args: {
        username: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existing = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .unique();

        if (existing) {
            throw new Error("Username already taken");
        }

        // Create new user
        // Note: In a real app, you should hash passwords (e.g. usage of bcrypt).
        // For this context/prototype, we are storing plain text or doing simple handling as requested.
        const userId = await ctx.db.insert("users", {
            tokenIdentifier: args.username, // Using username as token for now
            username: args.username,
            password: args.password,
            balanceAvailable: 1000,
            balanceAllTime: 0,
            inventory: [],
            stats: { wins: 0, losses: 0 },
        });

        const user = await ctx.db.get(userId);
        return user;
    },
});

export const login = mutation({
    args: {
        username: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .unique();

        if (!user || user.password !== args.password) {
            throw new Error("Invalid username or password");
        }

        return user;
    },
});
