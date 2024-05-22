import type { TDAsset, TDBinding, TDShape } from "@tldraw/tldraw";

export function removeUndefinedFields(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}
function mergeUpdates<V>(
  a: Record<string, V | null>,
  b: Record<string, V | null>,
): Record<string, V | null> {
  const out = Object.fromEntries(Object.entries(a));
  for (const [k, v] of Object.entries(b)) {
    out[k] = v;
  }
  return out;
}

export type RoomState = {
  shapes: Record<string, TDShape>;
  bindings: Record<string, TDBinding>;
  assets: Record<string, TDAsset>;
};

export type RoomDiff = {
  shapes: Record<string, TDShape | null>;
  bindings: Record<string, TDBinding | null>;
  assets: Record<string, TDAsset | null>;
};
function applyPatch<T>(
  state: Record<string, T>,
  patch: Record<string, T | null>,
) {
  const result = { ...state };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null) {
      result[k] = v;
    } else {
      delete result[k];
    }
  }
  return result;
}

export function patchRoom(state: RoomState, diff: RoomDiff): RoomState {
  return {
    shapes: applyPatch(state.shapes, diff.shapes),
    bindings: applyPatch(state.bindings, diff.bindings),
    assets: applyPatch(state.assets, diff.assets),
  };
}

export function mergeDiff(left: RoomDiff, right: RoomDiff): RoomDiff {
  return {
    shapes: mergeUpdates(left.shapes, right.shapes),
    bindings: mergeUpdates(left.bindings, right.bindings),
    assets: mergeUpdates(left.assets, right.assets),
  };
}
