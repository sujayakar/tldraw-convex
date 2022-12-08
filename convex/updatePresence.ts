import { mutation } from "./_generated/server"

export default mutation(async ({ db, auth }, tid, presence) => {
    const user = await auth.getUserIdentity();
    if (!user || !tid) {
        console.error("Not logged in");
        return;
    }
    const presenceRow = await db.query("presence")
        .filter(q => q.eq(q.field("tid"), tid))
        .first();
    if (!presenceRow) {
        db.insert("presence", {
            tid,
            presence,
            lastUpdated: Date.now(),
        })
        return;
    }
    presenceRow.presence = presence;
    presenceRow.lastUpdated = Date.now();
    await db.replace(presenceRow._id, presenceRow);
});