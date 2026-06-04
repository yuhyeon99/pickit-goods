import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../shared/model/auth/useAuth';
import { useTheme } from '../../shared/model/theme/useTheme';

const navItems = [
  { to: '/', label: '홈' },
  { to: '/gacha', label: '가챠' },
  { to: '/ticket', label: '티켓' },
  { to: '/guide', label: '이용안내' },
  { to: '/my', label: '마이페이지' },
];

export function Header() {
  const { isAdmin, isAuthenticated, isLoading, profile, signInWithGoogle, signOut, user } =
    useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName = profile?.displayName ?? user?.email ?? '사용자';
  const nextThemeLabel = theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경';
  const menuLabel = isMenuOpen ? '메뉴 닫기' : '메뉴 열기';

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header-top-row">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          Pickit Goods
        </NavLink>
        <div className="header-icon-actions">
          <button
            className="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            aria-label={`테마 변경: ${nextThemeLabel}`}
            title={nextThemeLabel}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
          <button
            className="menu-toggle-button"
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={menuLabel}
            aria-expanded={isMenuOpen}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={`header-right ${isMenuOpen ? 'header-right-open' : ''}`}>
        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link" onClick={closeMenu}>
              {item.label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink to="/admin" className="nav-link" onClick={closeMenu}>
              Admin
            </NavLink>
          ) : null}
        </nav>
        <div className="auth-header-area">
          {isLoading ? <span className="auth-status-text">확인 중</span> : null}
          {!isLoading && !isAuthenticated ? (
            <button className="auth-button" type="button" onClick={() => void signInWithGoogle()}>
              로그인
            </button>
          ) : null}
          {!isLoading && isAuthenticated ? (
            <>
              <NavLink to="/my" className="auth-user-link" onClick={closeMenu}>
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
