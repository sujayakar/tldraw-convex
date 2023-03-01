// HAX: For some reason even `import type` into tldraw doesn't work with our bundler.
interface TLAsset {
    id: string;
    type: string;
}
enum TDAssetType {
    Image = "image",
    Video = "video"
}
interface TDImageAsset extends TLAsset {
    type: TDAssetType.Image;
    fileName: string;
    src: string;
    size: number[];
}
interface TDVideoAsset extends TLAsset {
    type: TDAssetType.Video;
    fileName: string;
    src: string;
    size: number[];
}
export type TDAsset = TDImageAsset | TDVideoAsset;
enum TDShapeType {
    Sticky = "sticky",
    Ellipse = "ellipse",
    Rectangle = "rectangle",
    Triangle = "triangle",
    Draw = "draw",
    Arrow = "arrow",
    Line = "line",
    Text = "text",
    Group = "group",
    Image = "image",
    Video = "video"
}
enum ColorStyle {
    White = "white",
    LightGray = "lightGray",
    Gray = "gray",
    Black = "black",
    Green = "green",
    Cyan = "cyan",
    Blue = "blue",
    Indigo = "indigo",
    Violet = "violet",
    Red = "red",
    Orange = "orange",
    Yellow = "yellow"
}
enum SizeStyle {
    Small = "small",
    Medium = "medium",
    Large = "large"
}
enum DashStyle {
    Draw = "draw",
    Solid = "solid",
    Dashed = "dashed",
    Dotted = "dotted"
}
enum FontSize {
    Small = "small",
    Medium = "medium",
    Large = "large",
    ExtraLarge = "extraLarge"
}
enum AlignStyle {
    Start = "start",
    Middle = "middle",
    End = "end",
    Justify = "justify"
}
enum FontStyle {
    Script = "script",
    Sans = "sans",
    Serif = "serif",
    Mono = "mono"
}
type ShapeStyles = {
    color: ColorStyle;
    size: SizeStyle;
    dash: DashStyle;
    font?: FontStyle;
    textAlign?: AlignStyle;
    isFilled?: boolean;
    scale?: number;
};
interface TLHandle {
    id: string;
    index: number;
    point: number[];
}
interface TLShape {
    id: string;
    type: string;
    parentId: string;
    childIndex: number;
    name: string;
    point: number[];
    assetId?: string;
    rotation?: number;
    children?: string[];
    handles?: Record<string, TLHandle>;
    isGhost?: boolean;
    isHidden?: boolean;
    isLocked?: boolean;
    isGenerated?: boolean;
    isAspectRatioLocked?: boolean;
}

export interface TDBaseShape extends TLShape {
    style: ShapeStyles;
    type: TDShapeType;
    label?: string;
    handles?: Record<string, TDHandle>;
}
export interface DrawShape extends TDBaseShape {
    type: TDShapeType.Draw;
    points: number[][];
    isComplete: boolean;
}
export interface TDHandle extends TLHandle {
    canBind?: boolean;
    bindingId?: string;
}
export interface RectangleShape extends TDBaseShape {
    type: TDShapeType.Rectangle;
    size: number[];
    label?: string;
    labelPoint?: number[];
}
export interface EllipseShape extends TDBaseShape {
    type: TDShapeType.Ellipse;
    radius: number[];
    label?: string;
    labelPoint?: number[];
}
export interface TriangleShape extends TDBaseShape {
    type: TDShapeType.Triangle;
    size: number[];
    label?: string;
    labelPoint?: number[];
}
enum Decoration {
    Arrow = "arrow"
}

export interface ArrowShape extends TDBaseShape {
    type: TDShapeType.Arrow;
    bend: number;
    handles: {
        start: TDHandle;
        bend: TDHandle;
        end: TDHandle;
    };
    decorations?: {
        start?: Decoration;
        end?: Decoration;
        middle?: Decoration;
    };
    label?: string;
    labelPoint?: number[];
}
interface ImageShape extends TDBaseShape {
    type: TDShapeType.Image;
    size: number[];
    assetId: string;
}
interface VideoShape extends TDBaseShape {
    type: TDShapeType.Video;
    size: number[];
    assetId: string;
    isPlaying: boolean;
    currentTime: number;
}

export interface TextShape extends TDBaseShape {
    type: TDShapeType.Text;
    text: string;
}
export interface StickyShape extends TDBaseShape {
    type: TDShapeType.Sticky;
    size: number[];
    text: string;
}
export interface GroupShape extends TDBaseShape {
    type: TDShapeType.Group;
    size: number[];
    children: string[];
}
interface TLBinding {
    id: string;
    toId: string;
    fromId: string;
}

export interface ArrowBinding extends TLBinding {
    handleId: keyof ArrowShape['handles'];
    distance: number;
    point: number[];
}
export type TDBinding = ArrowBinding;
export type TDShape = RectangleShape | EllipseShape | TriangleShape | DrawShape | ArrowShape | TextShape | GroupShape | StickyShape | ImageShape | VideoShape;
