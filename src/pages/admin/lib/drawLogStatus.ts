import type { AdminDrawLog, DrawLogEventType } from '../model/drawLogTypes';

export const drawLogEventLabels: Record<DrawLogEventType, string> = {
  started: '시작',
  reserved: '예약',
  completed: '완료',
  failed: '실패',
  recovered: '복구',
};

export function getDrawLogEventTone(eventType: DrawLogEventType) {
  switch (eventType) {
    case 'completed':
    case 'recovered':
      return 'success';
    case 'failed':
      return 'danger';
    case 'reserved':
      return 'warning';
    default:
      return 'muted';
  }
}

export function formatShortId(value: string | null | undefined, length = 8) {
  if (!value) return '-';
  return value.slice(0, length);
}

export function summarizePayload(payload: AdminDrawLog['payload']) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return '-';
  }

  const entries = Object.entries(payload)
    .slice(0, 3)
    .map(([key, value]) => {
      const nextValue =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : Array.isArray(value)
            ? `array(${value.length})`
            : 'object';

      return `${key}: ${nextValue.slice(0, 18)}`;
    });

  return entries.length > 0 ? entries.join(' · ') : '-';
}
