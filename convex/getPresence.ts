import { v } from "convex/values";
import { query } from "./_generated/server";

export default query({
  args: {
    tid: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user || !args.tid) {
      console.error("Not logged in");
      return;
    }
    const rows = await ctx.db.query("presence").collect();
    const result = [];
    const now = Date.now();
    for (const row of rows) {
      if (row.tid === args.tid) {
        continue;
      }
      result.push(row);
    }
    return result;
  },
});
