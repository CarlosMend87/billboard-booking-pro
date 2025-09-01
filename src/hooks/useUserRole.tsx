import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'owner' | 'advertiser' | null;

// Temporary hardcoded owner emails until we have proper role management
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

    // Check if user email is in the owner list
    const userRole = OWNER_EMAILS.includes(user.email || '') ? 'owner' : 'advertiser';
    setRole(userRole);
    setLoading(false);
  }, [user]);

  return { role, loading };
}