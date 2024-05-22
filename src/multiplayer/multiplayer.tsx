/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useAuth0 } from "@auth0/auth0-react";
import { TDUserStatus, Tldraw, TldrawApp } from "@tldraw/tldraw";
import * as React from "react";
import { RoomProvider } from "./liveblocks.config";
import { useMultiplayerState } from "./useMultiplayerState";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";

const roomId = "mp-test-8";

/*
This example shows how to integrate TLDraw with a multiplayer room
via LiveBlocks. You could use any other service instead—the important
part is to get data from the Tldraw app when its document changes
and update it when the server's synchronized document changes.

Warning: Keeping images enabled for multiplayer applications
without providing a storage bucket based solution will cause
massive base64 string to be written to the multiplayer storage.
It's recommended to use a storage bucket based solution, such as
Amazon AWS S3. See the www project for our implementation.
*/

export function Multiplayer() {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        id: "DEFAULT_ID",
        user: {
          id: "DEFAULT_ID",
          status: TDUserStatus.Connecting,
          activeShapes: [],
          color: "black",
          point: [0, 0],
          selectedIds: [],
        },
      }}
    >
      <Editor roomId={roomId} />
    </RoomProvider>
  );
}

function Logout() {
  const { logout, user } = useAuth0();
  if (!user) {
    return <></>;
  }
  return (
    <div>
      <button
        className="logoutButton"
        onClick={() =>
          logout({ logoutParams: { returnTo: window.location.origin } })
        }
      >
        Logout ({user!.name})
      </button>
    </div>
  );
}

function Editor({ roomId }: { roomId: string }) {
  const { error, ...events } = useMultiplayerState(roomId);
  if (error) return <div>Error: {(error as any).message}</div>;

  const [app, setApp] = React.useState<TldrawApp>();
  const handleMount = React.useCallback(
    (app: TldrawApp) => {
      setApp(app);
    },
    [setApp],
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getUrl = useMutation(api.storage.getUrl);
  const onAssetCreate = React.useCallback(
    async (app: TldrawApp, file: File, id: string) => {
      const uploadUrl = await generateUploadUrl();
      console.log("uploading", uploadUrl, file);
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      console.log("storageId", storageId);
      const url = await getUrl({ storageId });
      console.log("url", url);
      return url!;
    },
    [],
  );
  const onAssetDelete = React.useCallback((app: TldrawApp, id: string) => {
    console.log("deleting", id);
    return true;
  }, []);
  return (
    <div>
      <div className="logout">
        <Logout />
      </div>
      <div className="tldraw">
        <Tldraw
          darkMode={false}
          showPages={false}
          disableAssets={false}
          showMultiplayerMenu={true}
          onAssetCreate={onAssetCreate}
          onAssetDelete={onAssetDelete}
          {...events}
        />
      </div>
    </div>
  );
}
