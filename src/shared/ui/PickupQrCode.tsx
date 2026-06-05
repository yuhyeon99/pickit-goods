import QRCode from 'react-qr-code';

type PickupQrCodeProps = {
  code: string | null;
};

function createPickupQrValue(code: string) {
  const pickupCode = encodeURIComponent(code);

  if (typeof window === 'undefined') {
    return `/admin/claims?pickupCode=${pickupCode}`;
  }

  return `${window.location.origin}/admin/claims?pickupCode=${pickupCode}`;
}

export function PickupQrCode({ code }: PickupQrCodeProps) {
  if (!code) {
    return (
      <div className="pickup-qr-card pickup-qr-card-empty">
        <strong>현장 수령 QR</strong>
        <p>아직 생성된 수령 코드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="pickup-qr-card">
      <strong>현장 수령 QR</strong>
      <div className="pickup-qr-frame" aria-label="현장 수령 QR 코드">
        <QRCode
          value={createPickupQrValue(code)}
          size={168}
          bgColor="#ffffff"
          fgColor="#111827"
          level="M"
        />
      </div>
      <dl>
        <div>
          <dt>수령 코드</dt>
          <dd>{code}</dd>
        </div>
      </dl>
      <p>현장 수령 시 이 QR 코드 또는 수령 코드를 제시해주세요.</p>
    </div>
  );
}
