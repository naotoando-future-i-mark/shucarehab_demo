import { ReactNode, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useRouter } from '../../router/Router';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoading } = useAdmin();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/calendar');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
