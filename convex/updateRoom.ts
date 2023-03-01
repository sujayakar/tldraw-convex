import { TDShape, TDBinding, TDAsset } from "./TDShape";
import { mutation } from "./_generated/server"

export default mutation(async (
    {db, auth},
    shapes: Map<string, TDShape | null>,
    bindings: Map<string, TDBinding | null>,
    assets: Map<string, TDAsset | null>,
) => {
    const user = await auth.getUserIdentity();
    if (!user) {
        console.error("Not logged in");
        return;
    }

    for (const [id, shape] of shapes.entries()) {
        const existing = await db.query("shapes")
            .filter(q => q.eq(q.field("tid"), id))
            .first();
        if (existing) {
            if (!shape) {
                await db.delete(existing._id);
            } else {
                if (existing.tid !== id) {
                    console.error("TID mismatch", existing, id);
                }
                await db.replace(existing._id, { tid: id, shape });
            }
        } else {
            await db.insert("shapes", { tid: id, shape });
        }
    }

    for (const [id, binding] of bindings.entries()) {
        const existing = await db.query("bindings")
            .filter(q => q.eq(q.field("tid"), id))
            .first();
        if (existing) {
            if (!binding) {
                await db.delete(existing._id);
            } else {
                if (existing.tid !== id) {
                    console.error("TID mismatch", existing, id);
                }
                await db.replace(existing._id, { tid: id, binding });
            }
        } else {
            await db.insert("binding", { tid: id, binding });
        }
    }

    for (const [id, asset] of assets.entries()) {
        const existing = await db.query("assets")
            .filter(q => q.eq(q.field("tid"), id))
            .first();
        if (existing) {
            if (!asset) {
                await db.delete(existing._id);
            } else {
                if (existing.tid !== id) {
                    console.error("TID mismatch", existing, id);
                }
                await db.replace(existing._id, { tid: id, asset });
            }
        } else {
            await db.insert("assets", { tid: id, asset });
        }
    }
});