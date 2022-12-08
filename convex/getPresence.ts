import { query } from "./_generated/server"

export default query(async ({db, auth}, tid) => {
    const user = await auth.getUserIdentity();
    if (!user) {
        console.error("Not logged in");
        return;
    }
    const rows = await db.query("presence").collect();
    const result = [];
    const now = Date.now();
    for (const row of rows) {
        if (row.tid === tid) {
            continue;
        }
        result.push(row);
    }
    return result;
});