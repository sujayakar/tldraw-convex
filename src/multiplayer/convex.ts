import { ConvexReactClient } from "convex/react";
import clientConfig from "../../convex/_generated/clientConfig";

export const convex = new ConvexReactClient(clientConfig, {unsavedChangesWarning: false});