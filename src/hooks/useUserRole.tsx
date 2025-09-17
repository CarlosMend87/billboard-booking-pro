import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'superadmin' | 'admin' | 'owner' | 'advertiser' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Get user profile with role from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('advertiser'); // Default role
        } else {
          setRole(profile?.role || 'advertiser');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('advertiser'); // Default role
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  return { role, loading };
}