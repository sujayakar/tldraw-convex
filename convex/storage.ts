import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async ({storage}) => {
    return storage.generateUploadUrl();
});

export const getUrl = mutation(async ({storage}, storageId: string) => {
    return await storage.getUrl(storageId);
});