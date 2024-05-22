import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  presence: defineTable({
    tid: v.string(),
    lastUpdated: v.number(),
    presence: v.any(),
  }).index("tid", ["tid"]),

  shapes: defineTable({
    tid: v.string(),
    shape: v.any(),
  }).index("tid", ["tid"]),

  bindings: defineTable({
    tid: v.string(),
    binding: v.any(),
  }).index("tid", ["tid"]),

  assets: defineTable({
    tid: v.string(),
    asset: v.any(),
  }).index("tid", ["tid"]),
});
