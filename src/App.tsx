import { Multiplayer } from "./multiplayer";
import "./styles.css";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { convex } from "~multiplayer/convex";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Authenticated, Unauthenticated } from "convex/react";

export function Login() {
  const { loginWithRedirect } = useAuth0();
  return (
    <main className="py-4">
      <div className="login">
        <h1>tldraw + Convex</h1>
        <button className="logoutButton" onClick={() => loginWithRedirect()}>
          Login
        </button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <main>
      <Auth0Provider
        domain="dev-1sfr-rpl.us.auth0.com"
        clientId="MHlQTTFFbLMNOYNHbI9OuJ43mTkcBswY"
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <ConvexProviderWithAuth0 client={convex}>
          <Unauthenticated>
            <Login />
          </Unauthenticated>
          <Authenticated>
            <Multiplayer />
          </Authenticated>
        </ConvexProviderWithAuth0>
      </Auth0Provider>
    </main>
  );
}
