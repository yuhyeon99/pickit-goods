import { Link } from 'react-router-dom';

const drawTypes = [
  {
    title: '가챠',
    badge: 'MVP 구현',
    items: [
      '가챠권을 구매하거나 보유합니다.',
      '가챠권을 사용하면 서버에서 즉시 랜덤 추첨합니다.',
      '구슬/캡슐 연출 후 결과 상품이 바로 확정됩니다.',
      '확정된 상품은 보관함에서 확인하고 수령 요청할 수 있습니다.',
    ],
  },
  {
    title: '티켓',
    badge: 'Placeholder',
    items: [
      '티켓을 구매하거나 보유합니다.',
      '번호판에서 원하는 칸을 선택하는 방식입니다.',
      '선택 순간 서버에서 상품을 매칭하는 구조로 계획되어 있습니다.',
      'MVP 1차에서는 화면만 제공하며 실제 티켓 추첨은 아직 지원하지 않습니다.',
    ],
  },
];

export function DrawIntroPage() {
  return (
    <section className="guide-page">
      <div className="page-heading">
        <p className="section-label">Draw Guide</p>
        <h1>가챠와 티켓은 이렇게 다릅니다</h1>
        <p>
          Pickit Goods의 뽑기는 서버에서 결과를 확정합니다. 현재 MVP에서는 가챠 흐름만
          실제로 사용할 수 있고, 티켓 추첨은 2차 기능으로 분리되어 있습니다.
        </p>
      </div>

      <div className="guide-card-grid">
        {drawTypes.map((type) => (
          <article className="guide-card" key={type.title}>
            <span className="soft-badge">{type.badge}</span>
            <h2>{type.title}</h2>
            <ul className="guide-list">
              {type.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="guide-card">
        <span className="soft-badge">현재 지원 범위</span>
        <h2>MVP 1차에서는 가챠만 실제 추첨됩니다</h2>
        <p>
          티켓 페이지는 구조와 접근 경로를 확인하기 위한 placeholder입니다. 티켓 번호는
          실제 상품을 직접 지정하지 않으며, 향후 서버 추첨 로직이 연결될 때 선택 순간 결과가
          매칭됩니다.
        </p>
        <div className="guide-actions">
          <Link className="primary-link-button" to="/gacha">
            가챠 보러가기
          </Link>
          <Link className="text-link-inline" to="/ticket">
            티켓 placeholder 보기
          </Link>
        </div>
      </section>
    </section>
  );
}
