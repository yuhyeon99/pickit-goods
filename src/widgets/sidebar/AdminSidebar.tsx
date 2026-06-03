import { NavLink } from 'react-router-dom';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/themes', label: 'Themes' },
  { to: '/admin/items', label: 'Reward Items' },
  { to: '/admin/pools', label: 'Pools' },
  { to: '/admin/gacha', label: 'Gacha' },
  { to: '/admin/tickets', label: 'Tickets' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/draw-logs', label: 'Draw Logs' },
  { to: '/admin/claims', label: 'Claims' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/policies', label: 'Policies' },
];

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink to="/admin" className="admin-brand">
        Pickit Admin
      </NavLink>
      <nav className="admin-nav" aria-label="Admin navigation">
        {adminNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="admin-nav-link" end={item.to === '/admin'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
