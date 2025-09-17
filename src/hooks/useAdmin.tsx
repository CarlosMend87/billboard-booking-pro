import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role: 'superadmin' | 'admin' | 'owner' | 'advertiser';
  phone?: string;
}

export function useAdmin() {
  const { toast } = useToast();

  const createUser = async (userData: CreateUserData) => {
    try {
      // First, create the auth user using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create the profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: userData.email,
            name: userData.name || null,
            role: userData.role,
            phone: userData.phone || null,
            status: 'active'
          });

        if (profileError) throw profileError;

        // Log the action
        await supabase.rpc('log_user_action', {
          action_type: 'create_user',
          resource_type: 'user',
          resource_id: authData.user.id,
          details: { 
            email: userData.email, 
            role: userData.role,
            name: userData.name 
          }
        });

        return { user: authData.user, error: null };
      }

      throw new Error('No user data returned');
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { user: null, error: error.message || 'Error al crear usuario' };
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_user_action', {
        action_type: 'update_user_status',
        resource_type: 'user',
        resource_id: userId,
        details: { status }
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      return { error: error.message || 'Error al actualizar estado del usuario' };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete from auth (this will cascade to profiles due to RLS)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Log the action
      await supabase.rpc('log_user_action', {
        action_type: 'delete_user',
        resource_type: 'user',
        resource_id: userId
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { error: error.message || 'Error al eliminar usuario' };
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_user_action', {
        action_type: 'reset_password',
        resource_type: 'user',
        resource_id: userId
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { error: error.message || 'Error al restablecer contraseña' };
    }
  };

  return {
    createUser,
    updateUserStatus,
    deleteUser,
    resetUserPassword
  };
}