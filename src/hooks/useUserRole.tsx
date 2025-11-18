import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'owner' | 'advertiser' | 'agente' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRole = async () => {
      if (!user) {
        if (!isMounted) return;
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Query user_roles table instead of profiles
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role');
          if (!isMounted) return;
          // Fallback to advertiser if there's any issue
          setRole('advertiser');
        } else {
          const dbRole = (data?.role as string) || 'advertiser';
          if (!isMounted) return;
          if (dbRole === 'owner') {
            setRole('owner');
          } else if (dbRole === 'agente') {
            setRole('agente');
          } else {
            setRole('advertiser');
          }
        }
      } catch (e) {
        console.error('Error loading user role');
        if (!isMounted) return;
        setRole('advertiser');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { role, loading };
}
