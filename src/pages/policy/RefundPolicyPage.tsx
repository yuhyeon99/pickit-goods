const refundAllowed = [
  '가챠권이 아직 사용되지 않았습니다.',
  '가챠권 유효기간이 지나지 않았습니다.',
  '해당 가챠권으로 draw_results가 생성되지 않았습니다.',
  '수령 요청이 생성되지 않았습니다.',
];

const refundNotAllowed = [
  '가챠권을 이미 사용해 결과 상품이 확정된 경우',
  '당첨 상품이 보관함에 생성된 경우',
  '당첨 상품에 대한 수령 요청이 접수된 경우',
  '정식 운영 정책에서 환불 불가로 정한 경우',
];

export function RefundPolicyPage() {
  return (
    <section className="guide-page">
      <div className="page-heading">
        <p className="section-label">Refund Policy</p>
        <h1>환불 정책 안내</h1>
        <p>
          현재 MVP의 환불 안내는 정식 운영 전 임시 기준입니다. 실제 결제, 취소, 환불 문구는
          외부 공개 전 운영 정책과 법무 검토를 통해 확정해야 합니다.
        </p>
      </div>

      <div className="guide-card-grid">
        <article className="guide-card">
          <span className="soft-badge">환불 요청 가능</span>
          <h2>미사용 가챠권은 유효기간 내 환불 요청이 가능합니다</h2>
          <ul className="guide-list">
            {refundAllowed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="guide-card">
          <span className="soft-badge">환불 불가</span>
          <h2>사용 완료된 가챠권은 환불할 수 없습니다</h2>
          <ul className="guide-list">
            {refundNotAllowed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <section className="guide-card">
        <span className="soft-badge">가챠권 유효기간</span>
        <h2>가챠권은 결제 완료일로부터 30일간 사용할 수 있습니다</h2>
        <p>
          만료된 가챠권은 추첨에 사용할 수 없습니다. 만료되어도 판매 수량은 자동 복구되지
          않으며, 만료된 가챠권의 환불 가능 여부는 추후 운영 정책에서 별도 확정합니다.
        </p>
      </section>

      <section className="guide-card policy-note-card">
        <span className="soft-badge">MVP 현재 범위</span>
        <h2>환불 자동화는 아직 구현되어 있지 않습니다</h2>
        <p>
          현재 MVP는 테스트 결제 흐름을 사용합니다. 실제 환불 요청 생성, 관리자 환불 처리,
          PG 환불 연동은 후속 작업에서 구현해야 합니다.
        </p>
      </section>
    </section>
  );
}
