import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDrawLogs } from '../api/getAdminDrawLogs';
import {
  drawLogEventLabels,
  drawResultStatusLabels,
  formatShortId,
  getDrawLogEventTone,
  summarizePayload,
} from '../lib/drawLogStatus';
import type { AdminDrawLog, AdminDrawLogFilters, DrawLogEventType } from '../model/drawLogTypes';
import type { RewardGrade } from '../../gacha/model/types';

const gradeOptions: Array<RewardGrade | 'all'> = ['all', 'S', 'A', 'B', 'C'];
const eventOptions: Array<DrawLogEventType | 'all'> = [
  'all',
  'started',
  'reserved',
  'completed',
  'failed',
  'recovered',
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getUserLabel(log: AdminDrawLog) {
  return log.userDisplayName ?? `사용자 ${formatShortId(log.userId)}`;
}

function filterLogs(logs: AdminDrawLog[], filters: AdminDrawLogFilters) {
  const search = filters.search.trim().toLowerCase();

  return logs.filter((log) => {
    const matchesSearch =
      search.length === 0 ||
      [
        log.drawProductTitle,
        log.userDisplayName,
        log.userId,
        log.rewardName,
        log.requestId,
        log.publicVerifyCode,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));

    const matchesGrade = filters.grade === 'all' || log.grade === filters.grade;
    const matchesEvent = filters.eventType === 'all' || log.eventType === filters.eventType;

    return matchesSearch && matchesGrade && matchesEvent;
  });
}

function AdminDrawLogCard({ log }: { log: AdminDrawLog }) {
  return (
    <article className="admin-log-card">
      <div className="admin-log-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`item-status-badge item-status-${getDrawLogEventTone(log.eventType)}`}>
              {drawLogEventLabels[log.eventType]}
            </span>
            {log.grade ? <span className="grade-badge">{log.grade}</span> : null}
            <span className="soft-badge">조회 전용</span>
          </div>
          <h2>{log.drawProductTitle ?? '가챠 정보 없음'}</h2>
          <p>
            {getUserLabel(log)} · {formatDate(log.createdAt)}
          </p>
        </div>
        <span className="soft-badge">로그 #{formatShortId(log.id)}</span>
      </div>

      <dl className="admin-log-meta">
        <div>
          <dt>결과 ID</dt>
          <dd>{formatShortId(log.drawResultId)}</dd>
        </div>
        <div>
          <dt>당첨 상품</dt>
          <dd>{log.rewardName ?? '-'}</dd>
        </div>
        <div>
          <dt>결과 상태</dt>
          <dd>{log.resultStatus ? drawResultStatusLabels[log.resultStatus] : '-'}</dd>
        </div>
        <div>
          <dt>검증 코드</dt>
          <dd>{formatShortId(log.publicVerifyCode)}</dd>
        </div>
        <div>
          <dt>재고 ID</dt>
          <dd>{formatShortId(log.selectedInventoryUnitId)}</dd>
        </div>
        <div>
          <dt>요청 ID</dt>
          <dd>{formatShortId(log.requestId, 12)}</dd>
        </div>
        <div>
          <dt>시드 해시</dt>
          <dd>{formatShortId(log.randomSeedHash, 12)}</dd>
        </div>
        <div>
          <dt>남은 재고</dt>
          <dd>{log.availableInventoryCount ?? '-'}</dd>
        </div>
      </dl>

      <section className="admin-log-payload">
        <strong>로그 데이터 요약</strong>
        <p>{summarizePayload(log.payload)}</p>
        {log.errorMessage ? <p className="admin-log-error">{log.errorMessage}</p> : null}
      </section>
    </article>
  );
}

export function AdminDrawLogsPage() {
  const [filters, setFilters] = useState<AdminDrawLogFilters>({
    search: '',
    grade: 'all',
    eventType: 'all',
  });

  const {
    data: logs = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-draw-logs'],
    queryFn: getAdminDrawLogs,
  });

  const filteredLogs = useMemo(() => filterLogs(logs, filters), [filters, logs]);

  if (isLoading) {
    return <section className="state-card">추첨 로그를 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>추첨 로그를 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-draw-logs-page">
      <div className="page-heading">
        <p className="section-label">관리자 · 추첨 로그</p>
        <h1>추첨 로그 조회</h1>
        <p>서버에서 기록된 추첨 감사 로그를 조회합니다. 로그와 결과는 이 화면에서 수정할 수 없습니다.</p>
      </div>

      <section className="admin-log-filter-card">
        <div>
          <label>
            검색
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="가챠명, 사용자, 상품명, 요청 ID"
            />
          </label>
        </div>
        <label>
          등급
          <select
            value={filters.grade}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                grade: event.target.value as AdminDrawLogFilters['grade'],
              }))
            }
          >
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade === 'all' ? '전체 등급' : grade}
              </option>
            ))}
          </select>
        </label>
        <label>
          로그 상태
          <select
            value={filters.eventType}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                eventType: event.target.value as AdminDrawLogFilters['eventType'],
              }))
            }
          >
            {eventOptions.map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType === 'all' ? '전체 상태' : drawLogEventLabels[eventType]}
              </option>
            ))}
          </select>
        </label>
        <span className="soft-badge">
          {filteredLogs.length} / {logs.length}건
        </span>
      </section>

      {filteredLogs.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">로그 없음</span>
          <h2>조건에 맞는 추첨 로그가 없습니다.</h2>
          <p>추첨이 실행되면 서버 감사 로그가 이곳에 최신순으로 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-log-list">
          {filteredLogs.map((log) => (
            <AdminDrawLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </section>
  );
}
