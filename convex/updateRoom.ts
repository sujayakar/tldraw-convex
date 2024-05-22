import { v } from "convex/values";
import { TDShape, TDBinding, TDAsset } from "./TDShape";
import { mutation } from "./_generated/server";

export default mutation({
  args: {
    shapes: v.any(),
    bindings: v.any(),
    assets: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      console.error("Not logged in");
      return;
    }

    const shapes = args.shapes as Record<string, TDShape | null>;
    const bindings = args.bindings as Record<string, TDBinding | null>;
    const assets = args.assets as Record<string, TDAsset | null>;

    for (const [id, shape] of Object.entries(shapes)) {
      const existing = await ctx.db
        .query("shapes")
        .withIndex("tid", (q) => q.eq("tid", id))
        .unique();
      if (existing) {
        if (!shape) {
          await ctx.db.delete(existing._id);
        } else {
          if (existing.tid !== id) {
            console.error("TID mismatch", existing, id);
          }
          await ctx.db.replace(existing._id, { tid: id, shape });
        }
      } else {
        await ctx.db.insert("shapes", { tid: id, shape });
      }
    }

    for (const [id, binding] of Object.entries(bindings)) {
      const existing = await ctx.db
        .query("bindings")
        .withIndex("tid", (q) => q.eq("tid", id))
        .unique();
      if (existing) {
        if (!binding) {
          await ctx.db.delete(existing._id);
        } else {
          if (existing.tid !== id) {
            console.error("TID mismatch", existing, id);
          }
          await ctx.db.replace(existing._id, { tid: id, binding });
        }
      } else {
        await ctx.db.insert("bindings", { tid: id, binding });
      }
    }

    for (const [id, asset] of Object.entries(assets)) {
      const existing = await ctx.db
        .query("assets")
        .withIndex("tid", (q) => q.eq("tid", id))
        .unique();
      if (existing) {
        if (!asset) {
          await ctx.db.delete(existing._id);
        } else {
          if (existing.tid !== id) {
            console.error("TID mismatch", existing, id);
          }
          await ctx.db.replace(existing._id, { tid: id, asset });
        }
      } else {
        await ctx.db.insert("assets", { tid: id, asset });
      }
    }
  },
});
