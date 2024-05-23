import type {
  TDAsset,
  TDBinding,
  TDShape,
  TDUser,
  TldrawApp,
} from "@tldraw/tldraw";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import useSingleFlight from "./useSingleFlight";
import { api } from "convex/_generated/api";
import { useConvex, useMutation } from "convex/react";
import { ConvexRoomManager } from "./ConvexRoomManager";
import { removeUndefinedFields } from "./util";

declare const window: Window & { app: TldrawApp };

export function useMultiplayerState(roomId: string) {
  const [app, setApp] = useState<TldrawApp>();

  const onUndo = useCallback(() => {
    throw new Error("Undo unimplemented");
  }, []);
  const onRedo = useCallback(() => {
    throw new Error("Redo unimplemented");
  }, []);

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

  const rIsPaused = useRef(false);
  const onSessionStart = useCallback(() => {
    rIsPaused.current = true;
  }, []);
  const onSessionEnd = useCallback(() => {
    rIsPaused.current = false;
  }, []);

  const { loading, onChangePage } = useConvexRoom(app);
  const onChangePresence = useConvexPresence(app);

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
    error: undefined,
    loading,
  };
}

function useConvexRoom(app?: TldrawApp) {
  const convex = useConvex();
  const manager = useRef<ConvexRoomManager>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!app) {
      return;
    }
    manager.current = new ConvexRoomManager(convex, app, setLoading);
    return () => {
      manager.current?.dispose();
    };
  }, [app, convex, setLoading]);

  const onChangePage = useCallback(
    (
      app: TldrawApp,
      shapes: Record<string, TDShape | undefined>,
      bindings: Record<string, TDBinding | undefined>,
      assets: Record<string, TDAsset | undefined>,
    ) => {
      const diff = {
        shapes: Object.fromEntries(
          Object.entries(shapes).map(([k, v]) => [
            k,
            v ? removeUndefinedFields(v) : null,
          ]),
        ),
        bindings: Object.fromEntries(
          Object.entries(bindings).map(([k, v]) => [k, v ?? null]),
        ),
        assets: Object.fromEntries(
          Object.entries(assets).map(([k, v]) => [k, v ?? null]),
        ),
      };
      manager.current?.submitUpdate(diff);
    },
    [manager],
  );
  return { loading, onChangePage };
}

function useConvexPresence(app?: TldrawApp) {
  const convex = useConvex();
  useEffect(() => {
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
  return onChangePresence;
}
