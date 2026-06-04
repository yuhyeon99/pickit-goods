import { Link } from 'react-router-dom';

type FaqItem = {
  question: string;
  answer: string;
  links?: Array<{
    to: string;
    label: string;
  }>;
};

const faqs: FaqItem[] = [
  {
    question: '가챠와 티켓은 무엇이 다른가요?',
    answer:
      '가챠는 보유한 가챠권을 사용하면 즉시 서버에서 랜덤 추첨하고 결과 상품이 확정됩니다. 티켓은 번호판에서 칸을 선택하는 방식으로 계획되어 있으며, MVP 1차에서는 placeholder 상태입니다.',
  },
  {
    question: '확률은 어떻게 계산되나요?',
    answer:
      '확률은 현재 남아 있는 뽑기 재고 기준으로 계산됩니다. 누군가 상품을 뽑으면 남은 재고가 바뀌고, 등급별 확률도 다시 계산될 수 있습니다.',
    links: [{ to: '/fairness', label: '공정성 안내 보기' }],
  },
  {
    question: '가챠권을 사면 바로 상품이 정해지나요?',
    answer:
      '아니요. 구매 시점에는 가챠권만 발급됩니다. 실제 상품은 가챠권을 사용해 추첨하는 순간 서버에서 확정됩니다.',
    links: [{ to: '/fairness', label: '추첨 방식 확인하기' }],
  },
  {
    question: '구매 가능 수량과 남은 뽑기 재고는 왜 다른가요?',
    answer:
      '구매 가능 수량은 판매 한도와 남은 뽑기 재고를 함께 고려합니다. 가챠권을 구매하면 판매 수량은 줄지만, 실제 실물 재고는 추첨하는 순간 차감됩니다.',
  },
  {
    question: '가챠권은 언제까지 사용할 수 있나요?',
    answer:
      '가챠권은 결제 완료일로부터 30일간 사용할 수 있습니다. 만료된 가챠권은 추첨에 사용할 수 없습니다.',
  },
  {
    question: '미사용 가챠권은 환불할 수 있나요?',
    answer:
      'MVP 정책상 미사용 가챠권은 유효기간 내 환불 요청 가능 대상으로 봅니다. 다만 환불 기능과 정식 환불 문구는 아직 구현/확정 전입니다.',
    links: [{ to: '/policy/refund', label: '환불 정책 보기' }],
  },
  {
    question: '당첨 상품은 어떻게 수령하나요?',
    answer:
      '당첨 상품은 보관함에서 확인한 뒤 /claim에서 배송 또는 현장 수령을 요청할 수 있습니다. 여러 상품을 묶어서 요청할 수 있습니다.',
    links: [{ to: '/policy/shipping', label: '배송/수령 안내 보기' }],
  },
  {
    question: '현장 수령 QR은 제공되나요?',
    answer:
      '현재 MVP에서는 실제 QR 이미지를 저장하거나 렌더링하지 않습니다. 대신 pickup code 문자열을 생성해 수령 확인에 사용할 수 있도록 설계되어 있습니다.',
    links: [{ to: '/policy/shipping', label: '현장 수령 안내 보기' }],
  },
];

export function FaqPage() {
  return (
    <section className="guide-page">
      <div className="page-heading">
        <p className="section-label">FAQ</p>
        <h1>자주 묻는 질문</h1>
        <p>
          현재 MVP 기준으로 사용자가 가장 먼저 확인해야 하는 가챠, 확률, 유효기간,
          환불, 수령 관련 질문을 정리했습니다.
        </p>
      </div>

      <div className="faq-grid">
        {faqs.map((faq) => (
          <article className="faq-card" key={faq.question}>
            <h2>{faq.question}</h2>
            <p>{faq.answer}</p>
            {faq.links ? (
              <div className="guide-actions">
                {faq.links.map((link) => (
                  <Link className="text-link-inline" key={link.to} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <section className="guide-card policy-note-card">
        <span className="soft-badge">정식 운영 전 확인</span>
        <h2>정책 문구는 임시 안내입니다</h2>
        <p>
          결제, 환불, 유효기간, 배송, 현장 수령 관련 문구는 실제 외부 공개 전에 운영 정책과
          법무 검토를 통해 확정해야 합니다.
        </p>
      </section>
    </section>
  );
}
