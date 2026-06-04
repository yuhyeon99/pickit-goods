import { NavLink } from 'react-router-dom';
import { useAuth } from '../../shared/model/auth/useAuth';
import { useTheme } from '../../shared/model/theme/useTheme';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/draw', label: 'Draw Guide' },
  { to: '/gacha', label: 'Gacha' },
  { to: '/ticket', label: 'Ticket' },
  { to: '/faq', label: 'FAQ' },
  { to: '/my', label: 'My Page' },
  { to: '/cart', label: 'Cart' },
];

export function Header() {
  const { isAdmin, isAuthenticated, isLoading, profile, signInWithGoogle, signOut, user } =
    useAuth();
  const { theme, toggleTheme } = useTheme();
  const displayName = profile?.displayName ?? user?.email ?? '사용자';
  const nextThemeLabel = theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경';

  return (
    <header className="site-header">
      <NavLink to="/" className="brand">
        Pickit Goods
      </NavLink>
      <div className="header-right">
        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link">
              {item.label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink to="/admin" className="nav-link">
              Admin
            </NavLink>
          ) : null}
        </nav>
        <div className="auth-header-area">
          <button
            className="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            aria-label={`테마 변경: ${nextThemeLabel}`}
            title={nextThemeLabel}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
          {isLoading ? <span className="auth-status-text">확인 중</span> : null}
          {!isLoading && !isAuthenticated ? (
            <button className="auth-button" type="button" onClick={() => void signInWithGoogle()}>
              로그인
            </button>
          ) : null}
          {!isLoading && isAuthenticated ? (
            <>
              <NavLink to="/my" className="auth-user-link">
                {displayName}
              </NavLink>
              <button className="auth-button auth-button-secondary" type="button" onClick={() => void signOut()}>
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
