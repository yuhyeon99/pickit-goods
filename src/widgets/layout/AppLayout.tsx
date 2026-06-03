import { Outlet } from 'react-router-dom';
import { Header } from '../header/Header';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-container">
        <Outlet />
      </main>
      <footer className="site-footer">MVP skeleton</footer>
    </div>
  );
}
