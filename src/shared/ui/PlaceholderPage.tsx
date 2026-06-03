type PlaceholderPageProps = {
  title: string;
  description?: string;
  badgeLabel?: string;
  ctaLabel?: string;
};

export function PlaceholderPage({
  title,
  description,
  badgeLabel = 'Placeholder',
  ctaLabel = '다음 단계 준비 중',
}: PlaceholderPageProps) {
  return (
    <section className="page-panel">
      <div className="page-panel-content">
        <span className="status-badge">{badgeLabel}</span>
        <div>
          <p className="section-label">Pickit Goods MVP</p>
          <h1>{title}</h1>
        </div>
        {description ? <p className="page-description">{description}</p> : null}
        <div className="page-actions">
          <button className="primary-button" type="button">
            {ctaLabel}
          </button>
          <span className="helper-text">기능 구현 전 화면 구조를 확인하는 단계입니다.</span>
        </div>
      </div>
    </section>
  );
}
