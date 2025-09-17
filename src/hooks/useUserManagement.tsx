import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: 'superadmin' | 'admin' | 'owner' | 'advertiser';
  status: 'active' | 'suspended' | 'inactive';
  last_login_at: string | null;
  created_at: string;
  phone: string | null;
  avatar_url: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  created_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
  };
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  const checkPermissions = async () => {
    try {
      const { data, error } = await supabase.rpc('user_has_permission', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id,
        perm: 'manage_users'
      });
      
      if (error) throw error;
      setHasPermission(data || false);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  const fetchUsers = async (searchTerm?: string, roleFilter?: string, statusFilter?: string) => {
    if (!hasPermission) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_users', {
        search_term: searchTerm || null,
        role_filter: roleFilter || null,
        status_filter: statusFilter || null,
        limit_count: 100,
        offset_count: 0
      });

      if (error) throw error;
      
      const typedUsers: User[] = (data || []).map((user: any) => ({
        ...user,
        role: user.role as 'superadmin' | 'admin' | 'owner' | 'advertiser',
        status: user.status as 'active' | 'suspended' | 'inactive'
      }));
      
      setUsers(typedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (limit = 50) => {
    if (!hasPermission) return;
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const createUser = async (userData: {
    email: string;
    name: string;
    role: 'superadmin' | 'admin' | 'owner' | 'advertiser';
    phone?: string;
  }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: Math.random().toString(36).slice(-12) + 'A1!',
        email_confirm: true,
        user_metadata: { name: userData.name }
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (profileError) throw profileError;

      await supabase.rpc('log_user_action', {
        action_type: 'create_user',
        resource_type: 'profile',
        resource_id: authData.user.id,
        details: { email: userData.email, role: userData.role }
      });

      toast({
        title: "Usuario creado",
        description: `Usuario ${userData.name} creado exitosamente`
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          role: updates.role,
          status: updates.status,
          phone: updates.phone,
          suspended_until: updates.status === 'suspended' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      await supabase.rpc('log_user_action', {
        action_type: 'update_user',
        resource_type: 'profile',
        resource_id: userId,
        details: updates
      });

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron exitosamente"
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      await supabase.rpc('log_user_action', {
        action_type: 'delete_user',
        resource_type: 'profile',
        resource_id: userId,
        details: {}
      });

      toast({
        title: "Usuario eliminado",
        description: "El usuario fue eliminado del sistema"
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      toast({
        title: "Contraseña restablecida",
        description: `Se envió un email de restablecimiento a ${email}`
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo restablecer la contraseña",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  const exportUsers = async () => {
    try {
      const csvData = users.map(user => ({
        'Nombre': user.name || '',
        'Email': user.email || '',
        'Rol': user.role,
        'Estado': user.status,
        'Teléfono': user.phone || '',
        'Último Login': user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '',
        'Creado': new Date(user.created_at).toLocaleString()
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación completa",
        description: "Los usuarios se exportaron correctamente"
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar los usuarios",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (hasPermission) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [hasPermission]);

  return {
    users,
    auditLogs,
    loading,
    hasPermission,
    fetchUsers,
    fetchAuditLogs,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    exportUsers
  };
}