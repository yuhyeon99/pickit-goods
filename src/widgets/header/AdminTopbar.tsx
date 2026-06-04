import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/model/auth/useAuth';
import { useTheme } from '../../shared/model/theme/useTheme';

export function AdminTopbar() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const displayName = profile?.displayName ?? user?.email ?? '관리자';
  const nextThemeLabel = theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-title">
        <span>Pickit Goods 관리자</span>
        <small>운영 화면</small>
      </div>
      <div className="admin-topbar-actions">
        <NavLink to="/" className="admin-topbar-link">
          홈으로
        </NavLink>
        <button
          className="theme-toggle-button"
          type="button"
          onClick={toggleTheme}
          aria-label={`테마 변경: ${nextThemeLabel}`}
          title={nextThemeLabel}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
        <span className="admin-topbar-user" title={displayName}>
          {displayName}
        </span>
        <button className="auth-button auth-button-secondary" type="button" onClick={() => void handleSignOut()}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
