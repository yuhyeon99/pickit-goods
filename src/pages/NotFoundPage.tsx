import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="page-panel">
      <p className="section-label">404</p>
      <h1>Page Not Found</h1>
      <p className="page-description">요청한 페이지를 찾을 수 없습니다.</p>
      <Link className="text-link" to="/">
        Home으로 이동
      </Link>
    </section>
  );
}
