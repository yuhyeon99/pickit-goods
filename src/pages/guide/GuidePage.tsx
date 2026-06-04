import { Link } from 'react-router-dom';

const steps = [
  {
    title: '1. 가챠 선택',
    description: '목록과 상세에서 가격, 구매 가능 수량, 남은 뽑기 재고, 등급별 확률을 확인합니다.',
  },
  {
    title: '2. 장바구니와 테스트 결제',
    description: '가챠 상품은 이용권 형태로 장바구니에 담기며, 테스트 결제 후 가챠권이 발급됩니다.',
  },
  {
    title: '3. 30일 안에 사용',
    description: '가챠권은 결제 완료일로부터 30일간 사용할 수 있습니다. 만료된 가챠권은 추첨에 사용할 수 없습니다.',
  },
  {
    title: '4. 서버 추첨',
    description: '가챠권을 사용하면 서버에서 재고를 확인하고 실제 상품 1개를 확정합니다.',
  },
  {
    title: '5. 보관함과 수령 요청',
    description: '당첨 상품은 보관함에서 확인하고, 배송 또는 현장 수령으로 요청할 수 있습니다.',
  },
];

const quantityPolicies = [
  '구매 가능 수량은 판매 한도와 남은 뽑기 재고 중 작은 값으로 계산합니다.',
  '가챠권을 구매하면 sold_count가 증가하지만 특정 상품이 미리 선점되지는 않습니다.',
  '실제 실물 재고는 추첨이 실행되는 순간 drawn 상태로 변경됩니다.',
];

const guideLinks = [
  {
    title: '공정성 안내',
    description: '추첨 결과가 어떻게 결정되고 기록되는지 확인할 수 있어요.',
    to: '/fairness',
    label: '공정성 안내 보기',
  },
  {
    title: '환불 정책',
    description: '미사용 가챠권 환불 기준과 제한 사항을 확인할 수 있어요.',
    to: '/policy/refund',
    label: '환불 정책 보기',
  },
  {
    title: '배송/수령 안내',
    description: '당첨 상품 배송과 현장 수령 방식을 확인할 수 있어요.',
    to: '/policy/shipping',
    label: '배송/수령 안내 보기',
  },
  {
    title: '자주 묻는 질문',
    description: '이용 중 자주 나오는 질문을 확인할 수 있어요.',
    to: '/faq',
    label: 'FAQ 보기',
  },
];

export function GuidePage() {
  return (
    <section className="guide-page">
      <div className="page-heading">
        <p className="section-label">Usage Guide</p>
        <h1>이용 흐름 안내</h1>
        <p>
          가챠권 구매부터 추첨, 보관함, 수령 요청까지의 MVP 흐름을 정리했습니다.
          현재 결제와 환불은 정식 PG 연동 전 테스트/안내 기준입니다.
        </p>
      </div>

      <div className="guide-step-list">
        {steps.map((step) => (
          <article className="guide-card" key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </article>
        ))}
      </div>

      <section className="guide-card">
        <span className="soft-badge">구매/재고 기준</span>
        <h2>구매 가능 수량과 뽑기 재고는 다릅니다</h2>
        <ul className="guide-list">
          {quantityPolicies.map((policy) => (
            <li key={policy}>{policy}</li>
          ))}
        </ul>
      </section>

      <section className="guide-card">
        <span className="soft-badge">더 알아보기</span>
        <h2>필요한 정책을 바로 확인하세요</h2>
        <p>
          구매 전, 추첨 전, 수령 전 확인하면 좋은 안내를 한곳에 모았습니다.
        </p>
        <div className="guide-card-grid">
          {guideLinks.map((link) => (
            <article className="guide-link-card" key={link.to}>
              <h3>{link.title}</h3>
              <p>{link.description}</p>
              <Link className="text-link-inline" to={link.to}>
                {link.label}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-card policy-note-card">
        <span className="soft-badge">정책 안내</span>
        <h2>정식 운영 전 안내 문구입니다</h2>
        <p>
          환불, 만료, 배송 안내는 MVP 기준 임시 문구입니다. 외부 공개 전에는 운영 정책과
          법무 검토를 거쳐 최종 문구를 확정해야 합니다.
        </p>
        <div className="guide-actions">
          <Link className="primary-link-button" to="/gacha">
            가챠 시작하기
          </Link>
          <Link className="text-link-inline" to="/faq">
            FAQ 보기
          </Link>
        </div>
      </section>
    </section>
  );
}
