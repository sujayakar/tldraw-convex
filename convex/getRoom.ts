import { query } from "./_generated/server"

export default query(async ({db}) => {
    const shapes = new Map((await db.query("shapes").collect()).map(doc => [doc.tid, doc.shape]));
    const bindings = new Map((await db.query("bindings").collect()).map(doc => [doc.tid, doc.binding]));
    const assets = new Map((await db.query("assets").collect()).map(doc => [doc.tid, doc.asset]));
    return { shapes, bindings, assets };
});