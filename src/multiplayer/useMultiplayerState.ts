import type { TDAsset, TDBinding, TDShape, TDUser, TldrawApp } from '@tldraw/tldraw'
import React, { useCallback, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {useMutation} from "../../convex/_generated/react"
import { convex } from './convex'
import useSingleFlight from './useSingleFlight'

declare const window: Window & { app: TldrawApp }

function removeUndefinedFields(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

// TODO:
// Moves/resizes animate really oddly, go through server => optimistic update + debouncing
// Arrows have an undefined inside

export function useMultiplayerState(roomId: string) {
  const [app, setApp] = useState<TldrawApp>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(true)

  // https://liveblocks.io/blog/how-to-build-undo-redo-in-a-multiplayer-environment
  const onUndo = () => {
    throw new Error("Undo TODO");
  }
  const onRedo = () => {
    throw new Error("Redo TODO");
  }
  const rIsPaused = useRef(false)

  // Callbacks --------------

  // Put the state into the window, for debugging.
  const onMount = useCallback(
    (app: TldrawApp) => {
      app.loadRoom(roomId)
      app.pause() // Turn off the app's own undo / redo stack
      window.app = app
      setApp(app)
    },
    [roomId]
  )

  // Update the live shapes when the app's shapes change.
  const updateRoom = useMutation("updateRoom");
  const tryUpdateRoom = useSingleFlight(updateRoom);
  const onChangePage = useCallback(
    (
      app: TldrawApp,
      shapes: Record<string, TDShape | undefined>,
      bindings: Record<string, TDBinding | undefined>,
      assets: Record<string, TDAsset | undefined>
    ) => {
      const shapes2 = new Map(Object.entries(shapes).map(([k, v]) => [k, v ? removeUndefinedFields(v) : null]))
      tryUpdateRoom(
        shapes2,
        new Map(Object.entries(bindings).map(([k, v]) => [k, v ?? null])),
        new Map(Object.entries(assets).map(([k, v]) => [k, v ?? null])),
        );
    },
    [tryUpdateRoom]
  )

  // Handle presence updates when the user's pointer / selection changes
  const updatePresence = useMutation("updatePresence");
  const tryUpdatePresence = useSingleFlight(updatePresence);

  const onChangePresence = useCallback(
    (app: TldrawApp, user: TDUser) => {
      tryUpdatePresence(app.room?.userId, user);
    },
    [tryUpdatePresence]
  )

  // Document Changes --------
  const initialZoom = useRef(false);
  React.useEffect(() => {
    if (!app) {
      return;
    }
    let stillAlive = true;
    const watch = convex.watchQuery("getRoom", []);
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
        app.replacePageContent(
          Object.fromEntries(shapes.entries()),
          Object.fromEntries(bindings.entries()),
          Object.fromEntries(assets.entries())
        )
      }
    }
    const dispose = watch.onUpdate(handleUpdate);
    return () => {
      stillAlive = false;
      dispose();
    }
  }, [app, convex])

  React.useEffect(() => {
    if (!app) {
      return;
    }
    let stillAlive = true;
    const watch = convex.watchQuery("getPresence", [app.room?.userId]);
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
      dispose()
    };
  }, [app, convex]);

  const onSessionStart = React.useCallback(() => {
    rIsPaused.current = true
  }, [])

  const onSessionEnd = React.useCallback(() => {
    rIsPaused.current = false
  }, [])

  const clear = useMutation("clear");
  useHotkeys(
    'ctrl+shift+l;,⌘+shift+l',
    () => {
      if (window.confirm('Reset the document?')) {
        clear();
      }
    },
    []
  )

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
  }
}
