import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import {
  AlignStyle,
  ColorStyle,
  DashStyle,
  Decoration,
  FontSize,
  FontStyle,
  RectangleShape,
  SizeStyle,
  TDAssetType,
  TDShapeType,
} from "./TDShape";

const handle = v.object({
  id: v.string(),
  index: v.number(),
  point: v.array(v.number()),
  canBind: v.optional(v.boolean()),
  bindingId: v.optional(v.string()),
});

const colorStyles = v.union(
  v.literal(ColorStyle.White),
  v.literal(ColorStyle.LightGray),
  v.literal(ColorStyle.Gray),
  v.literal(ColorStyle.Black),
  v.literal(ColorStyle.Green),
  v.literal(ColorStyle.Cyan),
  v.literal(ColorStyle.Blue),
  v.literal(ColorStyle.Indigo),
  v.literal(ColorStyle.Violet),
  v.literal(ColorStyle.Red),
  v.literal(ColorStyle.Orange),
  v.literal(ColorStyle.Yellow),
);
const sizeStyle = v.union(
  v.literal(SizeStyle.Small),
  v.literal(SizeStyle.Medium),
  v.literal(SizeStyle.Large),
);

const dashStyle = v.union(
  v.literal(DashStyle.Draw),
  v.literal(DashStyle.Solid),
  v.literal(DashStyle.Dashed),
  v.literal(DashStyle.Dotted),
);
const fontSize = v.union(
  v.literal(FontSize.Small),
  v.literal(FontSize.Medium),
  v.literal(FontSize.Large),
  v.literal(FontSize.ExtraLarge),
);
const alignStyle = v.union(
  v.literal(AlignStyle.Start),
  v.literal(AlignStyle.Middle),
  v.literal(AlignStyle.End),
  v.literal(AlignStyle.Justify),
);
const fontStyle = v.union(
  v.literal(FontStyle.Script),
  v.literal(FontStyle.Sans),
  v.literal(FontStyle.Serif),
  v.literal(FontStyle.Mono),
);

const shapeStyles = v.object({
  color: colorStyles,
  size: sizeStyle,
  dash: dashStyle,
  font: v.optional(fontStyle),
  textAlign: v.optional(alignStyle),
  isFilled: v.optional(v.boolean()),
  scale: v.optional(v.float64()),
});

const baseShape = {
  id: v.string(),
  parentId: v.string(),
  childIndex: v.float64(),
  name: v.string(),
  point: v.array(v.float64()),
  assetId: v.optional(v.string()),
  rotation: v.optional(v.float64()),
  children: v.optional(v.array(v.string())),
  // Record<string, TLHandle>
  handles: v.optional(v.any()),
  isGhost: v.optional(v.boolean()),
  isHidden: v.optional(v.boolean()),
  isLocked: v.optional(v.boolean()),
  isGenerated: v.optional(v.boolean()),
  isAspectRatioLocked: v.optional(v.boolean()),

  style: shapeStyles,
  label: v.optional(v.string()),
};

const rectangleShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Rectangle),
  size: v.array(v.float64()),
  labelPoint: v.optional(v.array(v.float64())),
});

const ellipseShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Ellipse),
  radius: v.array(v.float64()),
  labelPoint: v.optional(v.array(v.float64())),
});

const triangleShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Triangle),
  size: v.array(v.float64()),
  labelPoint: v.optional(v.array(v.float64())),
});

const drawShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Draw),
  points: v.array(v.array(v.float64())),
  isComplete: v.boolean(),
});

const decoration = v.literal(Decoration.Arrow);

const arrowShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Arrow),
  bend: v.number(),
  handles: v.object({
    start: handle,
    bend: handle,
    end: handle,
  }),
  decorations: v.optional(
    v.object({
      start: v.optional(decoration),
      end: v.optional(decoration),
      middle: v.optional(decoration),
    }),
  ),
  labelPoint: v.optional(v.array(v.float64())),
});

const textShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Text),
  text: v.string(),
});

const groupShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Group),
  size: v.array(v.float64()),
  children: v.array(v.string()),
});

const stickyShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Sticky),
  size: v.array(v.float64()),
  text: v.string(),
});

const imageShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Image),
  size: v.array(v.float64()),
  assetId: v.string(),
});

const videoShape = v.object({
  ...baseShape,
  type: v.literal(TDShapeType.Video),
  size: v.array(v.float64()),
  assetId: v.string(),
  isPlaying: v.boolean(),
  currentTime: v.number(),
});

export const shape = v.union(
  rectangleShape,
  ellipseShape,
  triangleShape,
  drawShape,
  arrowShape,
  textShape,
  groupShape,
  stickyShape,
  imageShape,
  videoShape,
);

const arrowBinding = v.object({
  id: v.string(),
  toId: v.string(),
  fromId: v.string(),
  handleId: v.union(v.literal("start"), v.literal("bend"), v.literal("end")),
  distance: v.float64(),
  point: v.array(v.float64()),
});

export const binding = arrowBinding;

const imageAsset = v.object({
  id: v.string(),
  type: v.literal(TDAssetType.Image),
  fileName: v.string(),
  src: v.string(),
  size: v.array(v.float64()),
});

const videoAsset = v.object({
  id: v.string(),
  type: v.literal(TDAssetType.Video),
  fileName: v.string(),
  src: v.string(),
  size: v.array(v.float64()),
});

export const asset = v.union(imageAsset, videoAsset);

export const presence = v.object({
  activeShapes: v.array(v.any()),
  color: v.string(),
  id: v.string(),
  point: v.array(v.float64()),
  selectedIds: v.array(v.string()),
  session: v.optional(v.boolean()),
});

export default defineSchema({
  presence: defineTable({
    tid: v.string(),
    lastUpdated: v.number(),
    presence,
  }).index("tid", ["tid"]),

  shapes: defineTable({
    tid: v.string(),
    shape,
  }).index("tid", ["tid"]),

  bindings: defineTable({
    tid: v.string(),
    binding,
  }).index("tid", ["tid"]),

  assets: defineTable({
    tid: v.string(),
    asset,
  }).index("tid", ["tid"]),
});
