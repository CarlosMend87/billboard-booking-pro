
-- TYPES
CREATE TYPE public.permission AS ENUM ('manage_users','manage_roles','manage_billboards','manage_campaigns','view_analytics','manage_system','export_data','manage_finances');
CREATE TYPE public.user_role AS ENUM ('superadmin','admin','owner','advertiser');
CREATE TYPE public.user_status AS ENUM ('active','suspended','inactive');

-- TABLES
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid, action text NOT NULL, resource_type text, resource_id uuid,
  details jsonb, ip_address inet, user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.billboards (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  owner_id uuid NOT NULL,
  nombre text NOT NULL, direccion text NOT NULL,
  lat numeric(10,8) NOT NULL, lng numeric(11,8) NOT NULL,
  tipo text NOT NULL, medidas jsonb DEFAULT '{}'::jsonb NOT NULL,
  digital jsonb, contratacion jsonb DEFAULT '{}'::jsonb NOT NULL,
  precio jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'disponible'::text NOT NULL,
  fotos text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT billboards_status_check CHECK (status = ANY (ARRAY['disponible','ocupada','mantenimiento'])),
  CONSTRAINT billboards_tipo_check CHECK (tipo = ANY (ARRAY['espectacular','muro','valla','parabus','digital']))
);

CREATE TABLE public.profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, email text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  status public.user_status DEFAULT 'active',
  last_login_at timestamptz, suspended_until timestamptz, suspended_reason text,
  created_by uuid, phone text, avatar_url text,
  role public.user_role DEFAULT 'advertiser' NOT NULL
);

CREATE TABLE public.reservas (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  advertiser_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  asset_name text NOT NULL, asset_type text NOT NULL, modalidad text NOT NULL,
  fecha_inicio date NOT NULL, fecha_fin date NOT NULL,
  precio_total numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT reservas_status_check CHECK (status = ANY (ARRAY['pending','accepted','rejected','completed']))
);

CREATE TABLE public."campañas" (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  nombre text NOT NULL, presupuesto_total numeric(10,2) NOT NULL,
  presupuesto_usado numeric(10,2) DEFAULT 0,
  dias_totales integer NOT NULL, dias_transcurridos integer DEFAULT 0,
  fecha_inicio date NOT NULL, fecha_fin date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "campañas_status_check" CHECK (status = ANY (ARRAY['active','paused','completed','cancelled']))
);

CREATE TABLE public.notificaciones (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  tipo text NOT NULL, titulo text NOT NULL, mensaje text NOT NULL,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  "campaña_id" uuid REFERENCES public."campañas"(id) ON DELETE SET NULL,
  leida boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT notificaciones_tipo_check CHECK (tipo = ANY (ARRAY['reserva_pendiente','compra_aceptada','compra_rechazada','campaña_completada']))
);

CREATE TABLE public.password_reset_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  requested_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.role_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  role public.user_role NOT NULL,
  permission public.permission NOT NULL,
  UNIQUE (role, permission)
);

CREATE TABLE public.superadmins (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL, name text,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  status text DEFAULT 'active',
  permissions jsonb DEFAULT '[]'::jsonb,
  two_factor_enabled boolean DEFAULT false,
  last_activity timestamptz
);

CREATE TABLE public.superadmin_password_resets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL, token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL, used_at timestamptz,
  requested_by uuid, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.superadmin_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  role text NOT NULL, permission text NOT NULL,
  UNIQUE (role, permission)
);

CREATE TABLE public.superadmin_user_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL, permission text NOT NULL,
  granted_by uuid, granted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, permission)
);

CREATE TABLE public.user_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  permission public.permission NOT NULL,
  granted_by uuid REFERENCES public.profiles(user_id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, permission)
);

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billboards TO authenticated;
GRANT SELECT ON public.billboards TO anon;
GRANT ALL ON public.billboards TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."campañas" TO authenticated;
GRANT ALL ON public."campañas" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificaciones TO authenticated;
GRANT ALL ON public.notificaciones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.superadmins TO authenticated;
GRANT ALL ON public.superadmins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.superadmin_password_resets TO authenticated;
GRANT ALL ON public.superadmin_password_resets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.superadmin_permissions TO authenticated;
GRANT ALL ON public.superadmin_permissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.superadmin_user_permissions TO authenticated;
GRANT ALL ON public.superadmin_user_permissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."campañas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'advertiser'));
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_uuid uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.superadmins WHERE user_id = user_uuid AND status = 'active');
END; $$;

CREATE OR REPLACE FUNCTION public.is_active_superadmin(_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.superadmins WHERE user_id = _user AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid uuid, perm public.permission) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u_role public.user_role; has_perm boolean := false;
BEGIN
  SELECT role INTO u_role FROM public.profiles WHERE user_id = user_uuid;
  SELECT EXISTS (SELECT 1 FROM public.role_permissions WHERE role = u_role AND permission = perm) INTO has_perm;
  IF NOT has_perm THEN
    SELECT EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = user_uuid AND permission = perm) INTO has_perm;
  END IF;
  RETURN has_perm;
END; $$;

CREATE OR REPLACE FUNCTION public.has_superadmin_permission(user_uuid uuid, perm text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u_role text; has_perm boolean := false;
BEGIN
  IF public.is_superadmin(user_uuid) THEN RETURN true; END IF;
  SELECT COALESCE(p.role::text,'advertiser') INTO u_role FROM public.profiles p WHERE p.user_id = user_uuid;
  SELECT EXISTS(SELECT 1 FROM public.superadmin_permissions WHERE role = u_role AND permission = perm) INTO has_perm;
  IF NOT has_perm THEN
    SELECT EXISTS(SELECT 1 FROM public.superadmin_user_permissions WHERE user_id = user_uuid AND permission = perm) INTO has_perm;
  END IF;
  RETURN has_perm;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_reserva() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
  VALUES (NEW.owner_id, 'reserva_pendiente', 'Nueva Reserva Pendiente',
    'Tienes una nueva solicitud de reserva para ' || NEW.asset_name, NEW.id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_reserva_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (NEW.advertiser_id, 'compra_aceptada', 'Reserva Aceptada',
      'Tu reserva para ' || NEW.asset_name || ' ha sido aceptada', NEW.id);
    INSERT INTO public."campañas" (reserva_id, advertiser_id, nombre, presupuesto_total, dias_totales, fecha_inicio, fecha_fin)
    VALUES (NEW.id, NEW.advertiser_id, 'Campaña ' || NEW.asset_name, NEW.precio_total,
      NEW.fecha_fin - NEW.fecha_inicio + 1, NEW.fecha_inicio, NEW.fecha_fin);
  END IF;
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (NEW.advertiser_id, 'compra_rechazada', 'Reserva Rechazada',
      'Tu reserva para ' || NEW.asset_name || ' ha sido rechazada', NEW.id);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_user_action(action_type text, resource_type text DEFAULT NULL, resource_id uuid DEFAULT NULL, details jsonb DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), action_type, resource_type, resource_id, details);
END; $$;

CREATE OR REPLACE FUNCTION public.update_last_login(user_uuid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles SET last_login_at = NOW() WHERE user_id = user_uuid;
END; $$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile() RETURNS TABLE(id uuid, user_id uuid, name text, role text, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT p.id, p.user_id, p.name, p.role::text, p.created_at, p.updated_at
    FROM public.profiles p WHERE p.user_id = auth.uid();
END; $$;

-- TRIGGERS
CREATE TRIGGER update_billboards_updated_at BEFORE UPDATE ON public.billboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "update_campañas_updated_at" BEFORE UPDATE ON public."campañas" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER on_new_reserva AFTER INSERT ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.handle_new_reserva();
CREATE TRIGGER on_reserva_status_change AFTER UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.handle_reserva_status_change();

-- POLICIES
CREATE POLICY "Public can view available billboards" ON public.billboards FOR SELECT USING (status = 'disponible');
CREATE POLICY "Owners can view their own billboards" ON public.billboards FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can create their own billboards" ON public.billboards FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own billboards" ON public.billboards FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own billboards" ON public.billboards FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reservas" ON public.reservas FOR SELECT USING (auth.uid() = advertiser_id OR auth.uid() = owner_id);
CREATE POLICY "Advertisers can create reservas" ON public.reservas FOR INSERT WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "Owners can update reserva status" ON public.reservas FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own campañas" ON public."campañas" FOR SELECT USING (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers can create campañas" ON public."campañas" FOR INSERT WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers can update their campañas" ON public."campañas" FOR UPDATE USING (auth.uid() = advertiser_id);

CREATE POLICY "Users can view their own notifications" ON public.notificaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notificaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notificaciones FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can check their own superadmin status" ON public.superadmins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Superadmins can insert superadmin records" ON public.superadmins FOR INSERT WITH CHECK (public.is_active_superadmin(auth.uid()));
CREATE POLICY "Superadmins can update superadmin records" ON public.superadmins FOR UPDATE USING (public.is_active_superadmin(auth.uid())) WITH CHECK (public.is_active_superadmin(auth.uid()));
CREATE POLICY "Superadmins can delete superadmin records" ON public.superadmins FOR DELETE USING (public.is_active_superadmin(auth.uid()));

CREATE POLICY "Only superadmins can manage password resets" ON public.superadmin_password_resets USING (public.is_superadmin(auth.uid()));
CREATE POLICY "Only superadmins can manage permissions" ON public.superadmin_permissions USING (public.is_superadmin(auth.uid()));
CREATE POLICY "Only superadmins can manage user permissions" ON public.superadmin_user_permissions USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Allow superadmin to view audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));
CREATE POLICY "Allow system to insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow superadmin access to role_permissions" ON public.role_permissions USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'superadmin'));
CREATE POLICY "Superadmins can manage password reset requests" ON public.password_reset_requests TO authenticated USING (public.user_has_permission(auth.uid(), 'manage_users'));
CREATE POLICY "Superadmins can manage all user_permissions" ON public.user_permissions TO authenticated USING (public.user_has_permission(auth.uid(), 'manage_users'));
