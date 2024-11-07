import { RouteObject } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Flow from './pages/Flow';
import AuthenticationPage from './pages/Login/login';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout/Layout';
import ProfilePage from './pages/Profile';

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
            path: 'flows',
            children: [
              {
                path: ':flowId',
                element: <Flow />,
              },
              {
                path: 'new',
                element: <Flow />,
              }
            ]
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          }
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