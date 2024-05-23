import type { TldrawApp } from "@tldraw/tldraw";
import { api } from "convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import { RoomState, RoomDiff, mergeDiff, patchRoom } from "./util";

export class ConvexRoomManager {
  setLoading?: (loading: boolean) => void;
  watchDispose: () => void;

  currentQueryValue?: RoomState;

  nextMutationId = 0;
  inflightMutationId: number | null = null;
  completedMutationId = 0;
  bufferedMutation: RoomDiff = {
    shapes: {},
    bindings: {},
    assets: {},
  };

  constructor(
    private convex: ConvexReactClient,
    private app: TldrawApp | undefined,
    setLoading: (loading: boolean) => void,
  ) {
    const watch = convex.watchQuery(api.getRoom.default, {});
    this.watchDispose = watch.onUpdate(() => {
      const result = watch.localQueryResult();
      if (!result) {
        return;
      }
      console.log("Updated query", result);
      if (this.setLoading) {
        this.setLoading(false);
        delete this.setLoading;
      }
      const { mutationId, ...remaining } = result;
      if (this.inflightMutationId) {
        if (!mutationId) {
          console.log(`Mutation ID ${this.inflightMutationId} completed!`);
          this.completedMutationId = this.inflightMutationId;
          this.inflightMutationId = null;

          // Kick off another mutation if needed.
          this.submitUpdate();
        } else {
          if (this.inflightMutationId !== mutationId) {
            throw new Error(
              `Mutation ID mismatch: expected ${this.inflightMutationId}, got ${mutationId}`,
            );
          }
        }
      } else {
        if (mutationId) {
          throw new Error(`Unexpected inflight mutation ID ${mutationId}`);
        }
      }
      this.currentQueryValue = remaining;
      this.updateApp();
    });
    this.setLoading = setLoading;
  }

  submitUpdate(diff?: RoomDiff) {
    if (!this.app) {
      return;
    }

    // Fold in the diff into the buffered mutation.
    if (diff) {
      this.bufferedMutation = mergeDiff(this.bufferedMutation, diff);
    }

    // If there isn't already a mutation inflight, kick one off.
    if (!this.inflightMutationId && this.hasBufferedMutation()) {
      const mutationId = this.nextMutationId++;
      this.inflightMutationId = mutationId;
      const args = this.bufferedMutation;
      this.bufferedMutation = { shapes: {}, bindings: {}, assets: {} };

      console.log("Kicking off", mutationId, args);

      const mutationPromise = this.convex.mutation(
        api.updateRoom.default,
        args,
        {
          optimisticUpdate: (localQueryStore, args) => {
            const result = localQueryStore.getQuery(api.getRoom.default, {});
            if (!result) {
              console.log("No result during optimistic update");
              return;
            }
            const newResult = { mutationId, ...patchRoom(result, args) };
            localQueryStore.setQuery(api.getRoom.default, {}, newResult);
          },
        },
      );
      mutationPromise.catch((e) => {
        console.error(`Mutation failed:`, e);
      });
    }

    this.updateApp();
  }

  hasBufferedMutation() {
    const { shapes, bindings, assets } = this.bufferedMutation;
    return (
      Object.keys(shapes).length > 0 ||
      Object.keys(bindings).length > 0 ||
      Object.keys(assets).length > 0
    );
  }

  updateApp() {
    if (!this.app || !this.currentQueryValue) {
      return;
    }
    const { shapes, bindings, assets } = patchRoom(
      this.currentQueryValue,
      this.bufferedMutation,
    );
    this.app.replacePageContent(shapes, bindings, assets);
  }

  dispose() {
    this.watchDispose();
  }
}
