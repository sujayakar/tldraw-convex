import * as React from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import CustomCursorsExample from '~custom-cursors'
import Export from '~export'
import IFrame from '~iframe'
import Api from './api'
import ApiControl from './api-control'
import Basic from './basic'
import ChangingId from './changing-id'
import DarkMode from './dark-mode'
import Develop from './develop'
import Embedded from './embedded'
import FileSystem from './file-system'
import LoadingFiles from './loading-files'
import { Multiplayer } from './multiplayer'
import NoSizeEmbedded from './no-size-embedded'
import Persisted from './persisted'
import PropsControl from './props-control'
import ReadOnly from './readonly'
import Scroll from './scroll'
import './styles.css'
import UIOptions from './ui-options'
import { ConvexProviderWithAuth0 } from "convex/react-auth0"
import { convex } from '~multiplayer/convex'
import convexConfig from "../convex.json";
import { useAuth0 } from '@auth0/auth0-react'

const pages: ({ path: string; component: any; title: string } | '---')[] = [
  { path: '/develop', component: Develop, title: 'Develop' },
  '---',
  { path: '/basic', component: Basic, title: 'Basic' },
  { path: '/dark-mode', component: DarkMode, title: 'Dark mode' },
  { path: '/ui-options', component: UIOptions, title: 'Custom UI' },
  { path: '/persisted', component: Persisted, title: 'Persisting state with an ID' },
  { path: '/loading-files', component: LoadingFiles, title: 'Using the file system' },
  { path: '/file-system', component: FileSystem, title: 'Loading files' },
  { path: '/api', component: Api, title: 'Using the TldrawApp API' },
  { path: '/readonly', component: ReadOnly, title: 'Readonly mode' },
  { path: '/controlled', component: PropsControl, title: 'Controlled via props' },
  { path: '/imperative', component: ApiControl, title: 'Controlled via the TldrawApp API' },
  { path: '/changing-id', component: ChangingId, title: 'Changing ID' },
  { path: '/custom-cursors', component: CustomCursorsExample, title: 'Custom Cursors' },
  { path: '/embedded', component: Embedded, title: 'Embedded' },
  {
    path: '/no-size-embedded',
    component: NoSizeEmbedded,
    title: 'Embedded (without explicit size)',
  },
  { path: '/export', component: Export, title: 'Export' },
  { path: '/scroll', component: Scroll, title: 'In a scrolling container' },
  { path: '/multiplayer', component: Multiplayer, title: 'Multiplayer' },
  { path: '/iframe', component: IFrame, title: 'IFrame' },
]

export function Login() {
  const { isLoading, loginWithRedirect } = useAuth0();
  if (isLoading) {
    return <button className="btn btn-primary">Loading...</button>;
  }
  return (
    <main className="py-4">
      <h1 className="text-center">Tldraw example</h1>
      <div className="text-center">
        <span>
          <button className="btn btn-primary" onClick={loginWithRedirect}>
            Log in
          </button>
        </span>
      </div>
    </main>
  );
}

function Logout() {
  const { logout, user } = useAuth0();
  if (!user) {
    return <></>
  }
  return (
    <div>
      {/* We know this component only renders if the user is logged in. */}
      <p>Logged in{user!.name ? ` as ${user!.name}` : ""}</p>
      <button
        className="btn btn-primary"
        onClick={() => logout({ returnTo: window.location.origin })}
      >
        Log out
      </button>
    </div>
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
        <Logout/>
      <Routes>
        {pages.map((page) =>
          page === '---' ? null : (
            <Route key={page.path} path={page.path} element={<page.component />} />
          )
        )}

        <Route
          path="/"
          element={
            <div>
              <img className="hero" src="./card-repo.png" />
              <ul className="links">
                {pages.map((page, i) =>
                  page === '---' ? (
                    <hr key={i} />
                  ) : (
                    <li key={i}>
                      <Link to={page.path}>{page.title}</Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          }
        />
      </Routes>
      </ConvexProviderWithAuth0>
    </main>
  )
}
