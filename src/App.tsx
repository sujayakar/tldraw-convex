import { Multiplayer } from './multiplayer'
import './styles.css'
import { ConvexProviderWithAuth0 } from "convex/react-auth0"
import { convex } from '~multiplayer/convex'
import convexConfig from "../convex.json";
import { useAuth0 } from '@auth0/auth0-react'

export function Login() {
  const { isLoading, loginWithRedirect } = useAuth0();
  if (isLoading) {
    return <button className="btn btn-primary">Loading...</button>;
  }
  return (
    <main className="py-4">
      <div className="login">
        <h1>tldraw + Convex</h1>
        <button className="logoutButton" onClick={loginWithRedirect}>
          Login
        </button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <main>
      <ConvexProviderWithAuth0
        client={convex}
        authInfo={convexConfig.authInfo[0]}
        loggedOut={<Login />}
      >
        <Multiplayer />
      </ConvexProviderWithAuth0>
    </main>
  )
}
