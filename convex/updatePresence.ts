import { v } from "convex/values";
import { mutation } from "./_generated/server";

export default mutation({
  args: {
    tid: v.optional(v.string()),
    presence: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user || !args.tid) {
      console.error("Not logged in");
      return;
    }
    const presenceRow = await ctx.db
      .query("presence")
      .withIndex("tid", (q) => q.eq("tid", args.tid!))
      .unique();
    if (!presenceRow) {
      ctx.db.insert("presence", {
        tid: args.tid,
        presence: args.presence,
        lastUpdated: Date.now(),
      });
      return;
    }
    presenceRow.presence = args.presence;
    presenceRow.lastUpdated = Date.now();
    await ctx.db.replace(presenceRow._id, presenceRow);
  },
});
