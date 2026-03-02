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
        if (!user) {
          if (mounted) { setIsAdmin(false); setIsLoading(false); }
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (mounted) {
          setIsAdmin(!error && data?.role === 'admin');
          setIsLoading(false);
        }
      } catch {
        if (mounted) { setIsAdmin(false); setIsLoading(false); }
      }
    };

    checkAdmin();
    return () => { mounted = false; };
  }, []);

  return { isAdmin, isLoading };
}
