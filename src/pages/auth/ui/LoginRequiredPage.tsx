import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';

type LoginRequiredPageProps = {
  title?: string;
  description?: string;
};

export function LoginRequiredPage({
  title = '로그인이 필요합니다',
  description = '이 페이지는 로그인한 사용자만 이용할 수 있습니다.',
}: LoginRequiredPageProps) {
  const { signInWithGoogle, error } = useAuth();

  return (
    <section className="auth-required-card">
      <span className="status-badge">Google OAuth</span>
      <div>
        <p className="section-label">Authentication</p>
        <h1>{title}</h1>
      </div>
      <p>{description}</p>
      {error ? <p className="auth-error-text">{error}</p> : null}
      <div className="auth-actions">
        <button className="primary-button" type="button" onClick={() => void signInWithGoogle()}>
          Google로 로그인
        </button>
        <Link className="text-link-inline" to="/">
          홈으로 이동
        </Link>
      </div>
    </section>
  );
}
