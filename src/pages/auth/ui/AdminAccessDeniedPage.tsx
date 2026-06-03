import { Link } from 'react-router-dom';

export function AdminAccessDeniedPage() {
  return (
    <section className="auth-required-card">
      <span className="status-badge status-badge-limited">권한 필요</span>
      <div>
        <p className="section-label">Admin</p>
        <h1>관리자 권한이 필요합니다</h1>
      </div>
      <p>관리자 페이지는 admin role을 가진 사용자만 접근할 수 있습니다.</p>
      <Link className="text-link-inline" to="/">
        홈으로 이동
      </Link>
    </section>
  );
}
