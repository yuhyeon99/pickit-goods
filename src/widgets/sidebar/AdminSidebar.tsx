import { NavLink } from 'react-router-dom';

const adminNavItems = [
  { to: '/admin', label: '관리자 대시보드' },
  { to: '/admin/items', label: '실물 상품' },
  { to: '/admin/pools', label: '상품 풀/재고 구성' },
  { to: '/admin/gacha', label: '가챠 상품' },
  { to: '/admin/themes', label: '테마 관리' },
  { to: '/admin/tickets', label: '티켓 관리' },
  { to: '/admin/orders', label: '주문 내역' },
  { to: '/admin/draw-logs', label: '추첨 로그' },
  { to: '/admin/claims', label: '수령 요청' },
  { to: '/admin/refunds', label: '환불 요청' },
  { to: '/admin/users', label: '사용자 관리' },
  { to: '/admin/policies', label: '정책/FAQ' },
];

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink to="/admin" className="admin-brand">
        Pickit 관리자
      </NavLink>
      <nav className="admin-nav" aria-label="관리자 메뉴">
        {adminNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="admin-nav-link" end={item.to === '/admin'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
