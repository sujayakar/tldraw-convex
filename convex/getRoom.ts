import { query } from "./_generated/server";

export default query({
  handler: async (ctx, args) => {
    const shapes = Object.fromEntries(
      (await ctx.db.query("shapes").collect()).map((doc) => [
        doc.tid,
        doc.shape,
      ]),
    );
    const bindings = Object.fromEntries(
      (await ctx.db.query("bindings").collect()).map((doc) => [
        doc.tid,
        doc.binding,
      ]),
    );
    const assets = Object.fromEntries(
      (await ctx.db.query("assets").collect()).map((doc) => [
        doc.tid,
        doc.asset,
      ]),
    );
    return { shapes, bindings, assets };
  },
});
