const deliverySteps = [
  '보관함에서 수령할 당첨 상품을 선택합니다.',
  '배송 수령 또는 현장 수령을 선택합니다.',
  '배송 수령은 수령자, 연락처, 주소를 입력합니다.',
  '관리자가 요청을 확인하고 준비 상태를 변경합니다.',
  '배송은 shipping, 현장 수령은 ready_for_pickup 상태를 거쳐 completed로 마감됩니다.',
];

const pickupNotes = [
  '현장 수령 요청 시 pickup code가 생성됩니다.',
  'MVP에서는 실제 QR 이미지를 저장하거나 렌더링하지 않습니다.',
  '수령 장소와 시간 안내는 추후 운영 정책에서 확정합니다.',
  '관리자 확인 후 준비 완료 상태가 되면 현장에서 수령할 수 있습니다.',
];

export function ShippingPolicyPage() {
  return (
    <section className="guide-page">
      <div className="page-heading">
        <p className="section-label">Shipping Policy</p>
        <h1>배송 및 수령 안내</h1>
        <p>
          당첨 상품은 보관함에서 확인한 뒤 배송 또는 현장 수령으로 요청할 수 있습니다.
          여러 상품을 한 번에 묶어 수령 요청할 수 있습니다.
        </p>
      </div>

      <section className="guide-card">
        <span className="soft-badge">수령 요청 흐름</span>
        <h2>보관중인 당첨 상품을 선택해 요청합니다</h2>
        <ol className="guide-number-list">
          {deliverySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <div className="guide-card-grid">
        <article className="guide-card">
          <span className="soft-badge">배송 수령</span>
          <h2>주소를 입력해 배송을 요청합니다</h2>
          <p>
            수령자 이름, 연락처, 우편번호, 주소, 상세 주소를 입력해야 합니다. 송장번호와
            택배사 연동은 MVP 이후 고도화 대상입니다.
          </p>
        </article>

        <article className="guide-card">
          <span className="soft-badge">현장 수령</span>
          <h2>pickup code로 현장에서 확인합니다</h2>
          <ul className="guide-list">
            {pickupNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </div>

      <section className="guide-card policy-note-card">
        <span className="soft-badge">임시 안내</span>
        <h2>배송/수령 문구는 정식 운영 전 확정이 필요합니다</h2>
        <p>
          실제 배송비, 묶음 배송 기준, 현장 수령 장소, 보관 기간, 분실/파손 대응은 외부 공개
          전에 운영 정책으로 확정해야 합니다.
        </p>
      </section>
    </section>
  );
}
