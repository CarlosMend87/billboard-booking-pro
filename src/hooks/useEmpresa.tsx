import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Empresa {
  id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface EmpresaUser {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string | null;
  last_login_at: string | null;
}

export function useEmpresa() {
  const { user } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresaUsers, setEmpresaUsers] = useState<EmpresaUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEmpresa();
    }
  }, [user]);

  const fetchEmpresa = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get current user's empresa_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.empresa_id) {
        setEmpresa(null);
        setLoading(false);
        return;
      }

      // Get empresa details
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', profile.empresa_id)
        .single();

      if (empresaError) throw empresaError;
      setEmpresa(empresaData);

      // Get all users from this empresa
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, name, email, role, status, last_login_at')
        .eq('empresa_id', profile.empresa_id);

      if (usersError) throw usersError;
      setEmpresaUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    empresa,
    empresaUsers,
    loading,
    refetch: fetchEmpresa
  };
}

// Hook for superadmin to manage all empresas
export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmpresa = async (nombre: string) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert({ nombre })
        .select()
        .single();

      if (error) throw error;
      setEmpresas(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      throw error;
    }
  };

  const updateEmpresa = async (id: string, nombre: string) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .update({ nombre })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setEmpresas(prev => prev.map(e => e.id === id ? data : e));
      return data;
    } catch (error: any) {
      throw error;
    }
  };

  const deleteEmpresa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEmpresas(prev => prev.filter(e => e.id !== id));
    } catch (error: any) {
      throw error;
    }
  };

  const assignUserToEmpresa = async (userId: string, empresaId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ empresa_id: empresaId })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  return {
    empresas,
    loading,
    refetch: fetchEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    assignUserToEmpresa
  };
}
