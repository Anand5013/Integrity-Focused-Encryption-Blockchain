import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: ReactNode | ((user: { role: string }) => ReactNode);
  requiredRole?: 'admin' | 'patient';
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps): React.JSX.Element => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (typeof children === 'function') {
    return <>{children(user)}</>;
  }
  return <>{children}</>;
};

export default PrivateRoute;