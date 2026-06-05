import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute, ProtectedRoute } from './routeGuards';
import { AdminClaimsPage } from '../../pages/admin/AdminClaimsPage';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { AdminDrawLogsPage } from '../../pages/admin/AdminDrawLogsPage';
import { AdminGachaPage } from '../../pages/admin/AdminGachaPage';
import { AdminItemsPage } from '../../pages/admin/AdminItemsPage';
import { AdminOrdersPage } from '../../pages/admin/AdminOrdersPage';
import { AdminPoliciesPage } from '../../pages/admin/AdminPoliciesPage';
import { AdminPoolsPage } from '../../pages/admin/AdminPoolsPage';
import { AdminRefundsPage } from '../../pages/admin/AdminRefundsPage';
import { AdminThemesPage } from '../../pages/admin/AdminThemesPage';
import { AdminTicketsPage } from '../../pages/admin/AdminTicketsPage';
import { AdminUsersPage } from '../../pages/admin/AdminUsersPage';
import { CartPage } from '../../pages/cart/CartPage';
import { ClaimPage } from '../../pages/claim/ClaimPage';
import { DrawIntroPage } from '../../pages/draw/DrawIntroPage';
import { FairnessPage } from '../../pages/fairness/FairnessPage';
import { FaqPage } from '../../pages/faq/FaqPage';
import { GachaDetailPage } from '../../pages/gacha/GachaDetailPage';
import { GachaListPage } from '../../pages/gacha/GachaListPage';
import { GachaPlayPage } from '../../pages/gacha/GachaPlayPage';
import { GuidePage } from '../../pages/guide/GuidePage';
import { HomePage } from '../../pages/home/HomePage';
import { MyClaimsPage } from '../../pages/my/MyClaimsPage';
import { MyDrawsPage } from '../../pages/my/MyDrawsPage';
import { MyItemsPage } from '../../pages/my/MyItemsPage';
import { MyOrdersPage } from '../../pages/my/MyOrdersPage';
import { MyPage } from '../../pages/my/MyPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { RefundPolicyPage } from '../../pages/policy/RefundPolicyPage';
import { ShippingPolicyPage } from '../../pages/policy/ShippingPolicyPage';
import { TicketDetailPage } from '../../pages/ticket/TicketDetailPage';
import { TicketListPage } from '../../pages/ticket/TicketListPage';
import { TicketPlayPlaceholderPage } from '../../pages/ticket/TicketPlayPlaceholderPage';
import { AdminLayout } from '../../widgets/layout/AdminLayout';
import { AppLayout } from '../../widgets/layout/AppLayout';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/draw', element: <DrawIntroPage /> },
      { path: '/gacha', element: <GachaListPage /> },
      { path: '/gacha/:id', element: <GachaDetailPage /> },
      {
        path: '/gacha/:id/play',
        element: (
          <ProtectedRoute>
            <GachaPlayPage />
          </ProtectedRoute>
        ),
      },
      { path: '/ticket', element: <TicketListPage /> },
      { path: '/ticket/:id', element: <TicketDetailPage /> },
      {
        path: '/ticket/:id/play',
        element: (
          <ProtectedRoute>
            <TicketPlayPlaceholderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my',
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/draws',
        element: (
          <ProtectedRoute>
            <MyDrawsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/items',
        element: (
          <ProtectedRoute>
            <MyItemsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/claims',
        element: (
          <ProtectedRoute>
            <MyClaimsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/orders',
        element: (
          <ProtectedRoute>
            <MyOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/claim',
        element: (
          <ProtectedRoute>
            <ClaimPage />
          </ProtectedRoute>
        ),
      },
      { path: '/guide', element: <GuidePage /> },
      { path: '/fairness', element: <FairnessPage /> },
      { path: '/policy/refund', element: <RefundPolicyPage /> },
      { path: '/policy/shipping', element: <ShippingPolicyPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'themes', element: <AdminThemesPage /> },
      { path: 'items', element: <AdminItemsPage /> },
      { path: 'pools', element: <AdminPoolsPage /> },
      { path: 'gacha', element: <AdminGachaPage /> },
      { path: 'tickets', element: <AdminTicketsPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'draw-logs', element: <AdminDrawLogsPage /> },
      { path: 'claims', element: <AdminClaimsPage /> },
      { path: 'refunds', element: <AdminRefundsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'policies', element: <AdminPoliciesPage /> },
    ],
  },
]);
