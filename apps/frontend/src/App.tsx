import { Outlet } from 'react-router-dom';

/**
 * Root shell. It deliberately owns nothing but the outlet: Home and each
 * portal render their own chrome, and portal logic stays under src/portals.
 */
export default function App() {
  return <Outlet />;
}
