import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'superadmin' | 'admin' | 'owner' | 'advertiser' | null;

// Hardcoded owner emails for backward compatibility
const OWNER_EMAILS = ['hm28443@gmail.com'];

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        // First check if user is superadmin
        const { data: superadmin, error: superAdminError } = await supabase
          .from('superadmins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!superAdminError && superadmin) {
          setRole('superadmin');
          setLoading(false);
          return;
        }

        // Then check profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && profile?.role) {
          setRole(profile.role);
        } else {
          // Fallback to email-based check for owners
          const userRole = OWNER_EMAILS.includes(user.email || '') ? 'owner' : 'advertiser';
          setRole(userRole);
          
          // Create profile if it doesn't exist
          if (!profile) {
            await supabase.from('profiles').insert({
              user_id: user.id,
              email: user.email,
              role: userRole,
              status: 'active'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Fallback based on email
        const fallbackRole = OWNER_EMAILS.includes(user.email || '') ? 'owner' : 'advertiser';
        setRole(fallbackRole);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading };
}