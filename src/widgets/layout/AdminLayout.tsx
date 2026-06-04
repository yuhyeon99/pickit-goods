import { Outlet } from 'react-router-dom';
import { AdminTopbar } from '../header/AdminTopbar';
import { AdminSidebar } from '../sidebar/AdminSidebar';

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminTopbar />
      <AdminSidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
