const fairnessItems = [
  {
    title: '결과는 서버에서 확정됩니다',
    description:
      '클라이언트는 버튼 클릭과 결과 표시만 담당합니다. 당첨 상품은 서버 RPC가 가챠권과 재고를 검증한 뒤 확정합니다.',
  },
  {
    title: '실제 재고 기준으로 추첨합니다',
    description:
      '추첨 시점에 남아 있는 inventory_units 중 하나가 선택되고, 선택된 재고는 drawn 상태로 변경됩니다.',
  },
  {
    title: '결과와 로그를 남깁니다',
    description:
      '확정 결과는 draw_results에 저장되고, 추첨 과정의 감사 정보는 draw_logs에 보관됩니다.',
  },
  {
    title: '관리자도 결과를 바꿀 수 없습니다',
    description:
      '관리자는 로그와 수령 요청을 확인할 수 있지만, 확정된 당첨 상품과 결과 로그를 임의로 수정할 수 없습니다.',
  },
];

const probabilityNotes = [
  '확률은 현재 남은 뽑기 재고 기준으로 계산됩니다.',
  '상품이 뽑힐 때마다 남은 재고와 등급별 확률은 달라질 수 있습니다.',
  '특정 등급 재고가 모두 소진되면 해당 등급은 더 이상 뽑히지 않습니다.',
  '예를 들어 C등급 재고가 모두 소진되면 남은 S/A/B 재고 기준으로 확률이 다시 계산됩니다.',
];

export function FairnessPage() {
  return (
    <section className="guide-page">
      <div className="page-heading">
        <p className="section-label">Fairness</p>
        <h1>공정성 안내</h1>
        <p>
          Pickit Goods의 추첨 결과는 클라이언트에서 만들지 않습니다. 서버에서 재고와
          가챠권을 확인한 뒤 결과를 확정하고, 검증 가능한 기록을 남깁니다.
        </p>
      </div>

      <div className="guide-card-grid">
        {fairnessItems.map((item) => (
          <article className="guide-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      <section className="guide-card">
        <span className="soft-badge">확률 기준</span>
        <h2>확률은 남은 재고 기준입니다</h2>
        <ul className="guide-list">
          {probabilityNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="guide-card">
        <span className="soft-badge">공개 범위</span>
        <h2>사용자에게는 안전한 정보만 보여줍니다</h2>
        <p>
          결과 화면에는 추첨 ID 일부와 검증 코드 일부를 표시합니다. 내부 seed, nonce,
          원본 난수 값, 다른 사용자의 정보는 공개하지 않습니다.
        </p>
      </section>
    </section>
  );
}
