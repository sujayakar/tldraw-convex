import { mutation } from "./_generated/server";

export default mutation({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      console.error("Not logged in");
      return;
    }
    for await (const doc of ctx.db.query("shapes")) {
      await ctx.db.delete(doc._id);
    }
    for await (const doc of ctx.db.query("bindings")) {
      await ctx.db.delete(doc._id);
    }
    for await (const doc of ctx.db.query("assets")) {
      await ctx.db.delete(doc._id);
    }
  },
});
