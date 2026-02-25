import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('useAdmin: user =', user?.id);
        if (!user) {
          if (mounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        console.log('useAdmin: admin query result =', { data, error });

        if (mounted) {
          setIsAdmin(!error && data !== null);
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  return { isAdmin, isLoading };
}
