import { mutation } from "./_generated/server"

export default mutation(async ({ db, auth }) => {
    const user = await auth.getUserIdentity();
    if (!user) {
        console.error("Not logged in");
        return;
    }
    for await (const doc of db.query("shapes")) {
        await db.delete(doc._id);
    }
    for await (const doc of db.query("bindings")) {
        await db.delete(doc._id);
    }
    for await (const doc of db.query("assets")) {
        await db.delete(doc._id);
    }
});