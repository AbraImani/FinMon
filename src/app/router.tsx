import { Navigate, createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '../shared/auth/RequireAuth'
import { RequireRole } from '../shared/auth/RequireRole'
import { AdminLoginPage } from '../modules/auth/pages/AdminLoginPage'
import { AgentLoginPage } from '../modules/auth/pages/AgentLoginPage'
import { AgentDashboardPage } from '../modules/agent/pages/AgentDashboardPage'
import { AgentOperationsPage } from '../modules/agent/pages/AgentOperationsPage'
import { AgentExpensesPage } from '../modules/agent/pages/AgentExpensesPage'
import { AgentClosurePage } from '../modules/agent/pages/AgentClosurePage'
import { AdminDashboardPage } from '../modules/admin/pages/AdminDashboardPage'
import { AdminTransactionsPage } from '../modules/admin/pages/AdminTransactionsPage'
import { AdminExpensesPage } from '../modules/admin/pages/AdminExpensesPage'
import { AdminClosuresPage } from '../modules/admin/pages/AdminClosuresPage'
import { AdminAuditPage } from '../modules/admin/pages/AdminAuditPage'
import { AdminAgentsExtensionsPage } from '../modules/admin/pages/AdminAgentsExtensionsPage'
import { NotFoundPage } from '../modules/common/pages/NotFoundPage'
import { AuthLayout } from '../shared/layouts/AuthLayout'
import { AgentLayout } from '../shared/layouts/AgentLayout'
import { AdminLayout } from '../shared/layouts/AdminLayout'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/connexion" replace />,
  },
  {
    path: '/connexion',
    element: <AuthLayout />,
    children: [{ index: true, element: <AgentLoginPage /> }],
  },
  {
    path: '/admin/connexion',
    element: <AuthLayout />,
    children: [{ index: true, element: <AdminLoginPage /> }],
  },
  {
    path: '/agent/connexion',
    element: <AuthLayout />,
    children: [{ index: true, element: <AgentLoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['agent']} />,
        children: [
          {
            path: '/agent',
            element: <AgentLayout />,
            children: [{ index: true, element: <AgentDashboardPage /> }],
          },
          {
            path: '/agent/operations',
            element: <AgentLayout />,
            children: [{ index: true, element: <AgentOperationsPage /> }],
          },
          {
            path: '/agent/depenses',
            element: <AgentLayout />,
            children: [{ index: true, element: <AgentExpensesPage /> }],
          },
          {
            path: '/agent/cloture',
            element: <AgentLayout />,
            children: [{ index: true, element: <AgentClosurePage /> }],
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['admin']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminDashboardPage /> }],
          },
          {
            path: '/admin/transactions',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminTransactionsPage /> }],
          },
          {
            path: '/admin/depenses',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminExpensesPage /> }],
          },
          {
            path: '/admin/utilisateurs',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminAgentsExtensionsPage /> }],
          },
          {
            path: '/admin/extensions',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminAgentsExtensionsPage /> }],
          },
          {
            path: '/admin/rapports',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminClosuresPage /> }],
          },
          {
            path: '/admin/audit',
            element: <AdminLayout />,
            children: [{ index: true, element: <AdminAuditPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
