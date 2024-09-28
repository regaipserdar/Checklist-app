import { RouteObject } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
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
          // Add other protected routes here if needed
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