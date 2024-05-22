import type {
  TDAsset,
  TDBinding,
  TDShape,
  TDUser,
  TldrawApp,
} from "@tldraw/tldraw";
import { OptimisticLocalStore } from "convex/browser";
import React, { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { convex } from "./convex";
import useSingleFlight from "./useSingleFlight";
import { api } from "convex/_generated/api";
import { useConvex, useMutation } from "convex/react";

declare const window: Window & { app: TldrawApp };

function removeUndefinedFields(obj: any) {
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

export function useMultiplayerState(roomId: string) {
  const [app, setApp] = useState<TldrawApp>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);

  // https://liveblocks.io/blog/how-to-build-undo-redo-in-a-multiplayer-environment
  const onUndo = () => {
    throw new Error("Undo TODO");
  };
  const onRedo = () => {
    throw new Error("Redo TODO");
  };
  const rIsPaused = useRef(false);

  // Callbacks --------------

  // Put the state into the window, for debugging.
  const onMount = useCallback(
    (app: TldrawApp) => {
      app.loadRoom(roomId);
      app.pause(); // Turn off the app's own undo / redo stack
      window.app = app;
      setApp(app);
    },
    [roomId],
  );

  // Room fetching and updating.
  const initialZoom = useRef(false);
  React.useEffect(() => {
    if (!app) {
      return;
    }
    let stillAlive = true;
    const watch = convex.watchQuery(api.getRoom.default, {});
    const handleUpdate = () => {
      const currentResult = watch.localQueryResult();
      if (currentResult && stillAlive) {
        if (loading) {
          setLoading(false);
        }
        if (!initialZoom.current) {
          app.zoomToFit();
          if (app.zoom > 1) {
            app.resetZoom();
          }
          initialZoom.current = true;
        }
        const { shapes, bindings, assets } = currentResult;
        app.replacePageContent(shapes, bindings, assets);
      }
    };
    const dispose = watch.onUpdate(handleUpdate);
    return () => {
      stillAlive = false;
      dispose();
    };
  }, [app, convex]);

  // Update the live shapes when the app's shapes change.
  const convexClient = useConvex();
  const updateRoom = useMutation(api.updateRoom.default);
  const flightStatus = useRef({
    inflightRequestId: null as null | number,
    upNext: null as null | {
      resolve: any;
      reject: any;
      args: { shapes: any; bindings: any; assets: any };
    },
  });
  const tryUpdateRoom = useCallback(
    (
      shapes: Record<string, any>,
      bindings: Record<string, any>,
      assets: Record<string, any>,
    ) => {
      const internalClient = (convexClient as any).sync;
      const optimisticUpdate = (
        localQueryStore: OptimisticLocalStore,
        args: {
          shapes: any;
          bindings: any;
          assets: any;
        },
      ) => {
        const result = localQueryStore.getQuery(api.getRoom.default, {});
        if (!result) {
          return;
        }
        const pairs = [
          [result.shapes, args.shapes],
          [result.bindings, args.bindings],
          [result.assets, args.assets],
        ];
        for (const [existing, patch] of pairs) {
          for (const [k, v] of Object.entries(patch)) {
            if (v !== null) {
              existing[k] = v;
            } else {
              delete existing[k];
            }
          }
        }
        const newResult = {
          shapes: pairs[0][0],
          bindings: pairs[1][0],
          assets: pairs[2][0],
        };
        localQueryStore.setQuery(api.getRoom.default, {}, newResult);
      };

      if (flightStatus.current.inflightRequestId !== null) {
        const qr = internalClient.optimisticQueryResults;
        qr.optimisticUpdates = qr.optimisticUpdates.filter(
          (u: any) => u.mutationId !== flightStatus.current.inflightRequestId,
        );
        const changedQueries = qr.applyOptimisticUpdate(
          (localQueryStore: any) =>
            optimisticUpdate(localQueryStore, { shapes, bindings, assets }),
          flightStatus.current.inflightRequestId,
        );
        internalClient.onTransition(changedQueries);

        const mergedArgs: any = {
          shapes: mergeUpdates(
            flightStatus.current.upNext?.args.shapes ?? {},
            shapes,
          ),
          bindings: mergeUpdates(
            flightStatus.current.upNext?.args.bindings ?? {},
            bindings,
          ),
          assets: mergeUpdates(
            flightStatus.current.upNext?.args.assets ?? {},
            assets,
          ),
        };
        return new Promise((resolve, reject) => {
          flightStatus.current.upNext = { resolve, reject, args: mergedArgs };
        });
      }
      const requestId = internalClient.nextRequestId;
      flightStatus.current.inflightRequestId = requestId;
      const firstReq = updateRoom.withOptimisticUpdate(optimisticUpdate)({
        shapes,
        bindings,
        assets,
      });
      void (async () => {
        try {
          await firstReq;
        } catch (e: any) {
          console.error(`Mutation failed:`, e);
          // move on
        }
        while (flightStatus.current.upNext) {
          let cur = flightStatus.current.upNext;
          flightStatus.current.upNext = null;
          flightStatus.current.inflightRequestId = internalClient.nextRequestId;
          await updateRoom
            .withOptimisticUpdate(optimisticUpdate)(cur.args)
            .then(cur.resolve)
            .catch(cur.reject);
        }
        flightStatus.current.inflightRequestId = null;
      })();
      return firstReq;
    },
    [convexClient, updateRoom],
  );

  const onChangePage = useCallback(
    (
      app: TldrawApp,
      shapes: Record<string, TDShape | undefined>,
      bindings: Record<string, TDBinding | undefined>,
      assets: Record<string, TDAsset | undefined>,
    ) => {
      tryUpdateRoom(
        Object.fromEntries(
          Object.entries(shapes).map(([k, v]) => [
            k,
            v ? removeUndefinedFields(v) : null,
          ]),
        ),
        Object.fromEntries(
          Object.entries(bindings).map(([k, v]) => [k, v ?? null]),
        ),
        Object.fromEntries(
          Object.entries(assets).map(([k, v]) => [k, v ?? null]),
        ),
      );
    },
    [updateRoom],
  );

  // Presence fetching and updating.
  React.useEffect(() => {
    if (!app) {
      return;
    }
    let stillAlive = true;
    const watch = convex.watchQuery(api.getPresence.default, {
      tid: app.room?.userId,
    });
    const handleUpdate = () => {
      const currentResult = watch.localQueryResult();
      if (currentResult && stillAlive) {
        const now = Date.now();
        const users = currentResult
          .filter((row: any) => row.lastUpdated >= now - 10000)
          .map((row: any) => row.presence);
        app.updateUsers(users);
      }
    };
    handleUpdate();
    const dispose = watch.onUpdate(handleUpdate);
    return () => {
      stillAlive = false;
      dispose();
    };
  }, [app, convex]);

  const updatePresence = useMutation(api.updatePresence.default);
  const tryUpdatePresence = useSingleFlight(updatePresence);

  const onChangePresence = useCallback(
    (app: TldrawApp, user: TDUser) => {
      tryUpdatePresence({ tid: app.room?.userId, presence: user });
    },
    [tryUpdatePresence],
  );

  const onSessionStart = React.useCallback(() => {
    rIsPaused.current = true;
  }, []);

  const onSessionEnd = React.useCallback(() => {
    rIsPaused.current = false;
  }, []);

  const clear = useMutation(api.clear.default);
  useHotkeys(
    "ctrl+shift+l;,⌘+shift+l",
    () => {
      if (window.confirm("Reset the document?")) {
        clear();
      }
    },
    [],
  );

  return {
    onUndo,
    onRedo,
    onMount,
    onSessionStart,
    onSessionEnd,
    onChangePage,
    onChangePresence,
    error,
    loading,
  };
}
