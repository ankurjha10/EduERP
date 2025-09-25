import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/auth'
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user is authenticated but role is still loading, show loading
  if (user && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'staff':
        return <Navigate to="/staff" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;