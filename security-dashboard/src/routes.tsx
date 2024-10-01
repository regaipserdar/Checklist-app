import { RouteObject } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Flow from './pages/Flow';
import AuthenticationPage from './pages/Login/login';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'flows/:flowId',
            element: <Flow />,
          },
          {
            path: 'flows/new',
            element: <Flow />,
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <AuthenticationPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;