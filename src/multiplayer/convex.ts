import { ConvexReactClient } from "convex/react";

const address = import.meta.env.VITE_CONVEX_URL;
export const convex = new ConvexReactClient(address, {unsavedChangesWarning: false});