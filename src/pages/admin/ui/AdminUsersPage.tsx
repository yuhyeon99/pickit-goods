import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminUsers } from '../api/getAdminUsers';
import { formatCurrency, orderStatusLabels } from '../lib/orderStatus';
import { getUserRoleTone, userRoleLabels } from '../lib/userRole';
import type { AdminUser, AdminUserFilters } from '../model/userTypes';
import type { UserRole } from '../../../shared/model/auth/types';

const roleOptions: Array<UserRole | 'all'> = ['all', 'user', 'admin'];

function formatDate(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function getUserName(user: AdminUser) {
  return user.displayName ?? `사용자 ${shortId(user.id)}`;
}

function filterUsers(users: AdminUser[], filters: AdminUserFilters) {
  const search = filters.search.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      search.length === 0 ||
      [user.id, user.displayName].filter(Boolean).some((value) => value?.toLowerCase().includes(search));
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesCreditPresence =
      filters.creditPresence === 'all' ||
      (filters.creditPresence === 'has_unused' && user.unusedCreditCount > 0) ||
      (filters.creditPresence === 'no_unused' && user.unusedCreditCount === 0);

    return matchesSearch && matchesRole && matchesCreditPresence;
  });
}

function Avatar({ user }: { user: AdminUser }) {
  if (user.avatarUrl) {
    return <img className="admin-user-avatar" src={user.avatarUrl} alt="" />;
  }

  return <span className="admin-user-avatar admin-user-avatar-empty">{getUserName(user).slice(0, 1)}</span>;
}

function AdminUserCard({ user }: { user: AdminUser }) {
  return (
    <article className="admin-user-card">
      <div className="admin-user-header">
        <div className="admin-user-identity">
          <Avatar user={user} />
          <div>
            <div className="cart-item-title-row">
              <span className={`item-status-badge item-status-${getUserRoleTone(user.role)}`}>
                {userRoleLabels[user.role]}
              </span>
              <span className="soft-badge">조회 전용</span>
            </div>
            <h2>{getUserName(user)}</h2>
            <p>ID {shortId(user.id)} · 가입일 {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      <dl className="admin-user-summary">
        <div>
          <dt>주문</dt>
          <dd>{user.orderCount}건</dd>
        </div>
        <div>
          <dt>보유권</dt>
          <dd>{user.unusedCreditCount}개</dd>
        </div>
        <div>
          <dt>사용 완료권</dt>
          <dd>{user.usedCreditCount}개</dd>
        </div>
        <div>
          <dt>당첨 결과</dt>
          <dd>{user.drawResultCount}개</dd>
        </div>
        <div>
          <dt>수령 요청</dt>
          <dd>{user.claimRequestCount}건</dd>
        </div>
        <div>
          <dt>최근 수정</dt>
          <dd>{formatDate(user.updatedAt)}</dd>
        </div>
      </dl>

      <details className="admin-user-details">
        <summary>상세 요약 보기</summary>
        <section>
          <h3>가챠권 요약</h3>
          <dl className="admin-user-credit-grid">
            <div>
              <dt>전체</dt>
              <dd>{user.creditSummary.total}</dd>
            </div>
            <div>
              <dt>unused</dt>
              <dd>{user.creditSummary.unused}</dd>
            </div>
            <div>
              <dt>used</dt>
              <dd>{user.creditSummary.used}</dd>
            </div>
            <div>
              <dt>expired</dt>
              <dd>{user.creditSummary.expired}</dd>
            </div>
            <div>
              <dt>refunded</dt>
              <dd>{user.creditSummary.refunded}</dd>
            </div>
            <div>
              <dt>failed</dt>
              <dd>{user.creditSummary.failed}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3>최근 주문</h3>
          {user.recentOrders.length === 0 ? (
            <p>최근 주문이 없습니다.</p>
          ) : (
            <div className="admin-user-mini-list">
              {user.recentOrders.map((order) => (
                <div key={order.id}>
                  <strong>주문 #{shortId(order.id)}</strong>
                  <span>
                    {orderStatusLabels[order.status]} · {formatCurrency(order.totalAmount)} ·{' '}
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>최근 당첨 결과</h3>
          {user.recentDrawResults.length === 0 ? (
            <p>최근 당첨 결과가 없습니다.</p>
          ) : (
            <div className="admin-user-mini-list">
              {user.recentDrawResults.map((result) => (
                <div key={result.id}>
                  <strong>
                    {result.grade} · {result.rewardName}
                  </strong>
                  <span>
                    {result.drawProductTitle} · {result.status} · {formatDate(result.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </details>
    </article>
  );
}

export function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserFilters>({
    search: '',
    role: 'all',
    creditPresence: 'all',
  });

  const {
    data: users = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  const filteredUsers = useMemo(() => filterUsers(users, filters), [filters, users]);

  if (isLoading) {
    return <section className="state-card">사용자 목록을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>사용자 목록을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-users-page">
      <div className="page-heading">
        <p className="section-label">Admin Users</p>
        <h1>사용자/가챠권 조회</h1>
        <p>사용자별 주문, 가챠권, 당첨 결과, 수령 요청 수치를 조회합니다. 권한 변경과 수동 지급은 지원하지 않습니다.</p>
      </div>

      <section className="admin-user-filter-card">
        <label>
          검색
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="사용자명, user id"
          />
        </label>
        <label>
          role
          <select
            value={filters.role}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                role: event.target.value as AdminUserFilters['role'],
              }))
            }
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role === 'all' ? '전체 role' : userRoleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label>
          보유권
          <select
            value={filters.creditPresence}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                creditPresence: event.target.value as AdminUserFilters['creditPresence'],
              }))
            }
          >
            <option value="all">전체</option>
            <option value="has_unused">보유권 있음</option>
            <option value="no_unused">보유권 없음</option>
          </select>
        </label>
        <span className="soft-badge">
          {filteredUsers.length} / {users.length}명
        </span>
      </section>

      {filteredUsers.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">사용자 없음</span>
          <h2>조건에 맞는 사용자가 없습니다.</h2>
          <p>Google OAuth 로그인 후 profile이 생성되면 이곳에 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-user-list">
          {filteredUsers.map((user) => (
            <AdminUserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </section>
  );
}
