
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role text NOT NULL DEFAULT 'advertiser' CHECK (role IN ('owner','advertiser','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE TABLE public.billboards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  nombre text NOT NULL,
  direccion text NOT NULL,
  lat decimal(10,8) NOT NULL,
  lng decimal(11,8) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('espectacular','muro','valla','parabus','digital')),
  medidas jsonb NOT NULL DEFAULT '{}'::jsonb,
  digital jsonb,
  contratacion jsonb NOT NULL DEFAULT '{}'::jsonb,
  precio jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible','ocupada','mantenimiento')),
  fotos text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billboards TO authenticated;
GRANT SELECT ON public.billboards TO anon;
GRANT ALL ON public.billboards TO service_role;
ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view their own billboards" ON public.billboards FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Public can view available billboards" ON public.billboards FOR SELECT USING (status = 'disponible');
CREATE POLICY "Owners can create their own billboards" ON public.billboards FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own billboards" ON public.billboards FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own billboards" ON public.billboards FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.reservas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  asset_type text NOT NULL,
  modalidad text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  precio_total decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reservas" ON public.reservas FOR SELECT USING (auth.uid() = advertiser_id OR auth.uid() = owner_id);
CREATE POLICY "Advertisers can create reservas" ON public.reservas FOR INSERT WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "Owners can update reserva status" ON public.reservas FOR UPDATE USING (auth.uid() = owner_id);

CREATE TABLE public.campañas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  presupuesto_total decimal(10,2) NOT NULL,
  presupuesto_usado decimal(10,2) DEFAULT 0,
  dias_totales integer NOT NULL,
  dias_transcurridos integer DEFAULT 0,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campañas TO authenticated;
GRANT ALL ON public.campañas TO service_role;
ALTER TABLE public.campañas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own campañas" ON public.campañas FOR SELECT USING (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers can create campañas" ON public.campañas FOR INSERT WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers can update their campañas" ON public.campañas FOR UPDATE USING (auth.uid() = advertiser_id);

CREATE TABLE public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('reserva_pendiente','compra_aceptada','compra_rechazada','campaña_completada')),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  campaña_id uuid REFERENCES public.campañas(id) ON DELETE SET NULL,
  leida boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificaciones TO authenticated;
GRANT ALL ON public.notificaciones TO service_role;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notificaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notificaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON public.notificaciones FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_billboards_updated_at BEFORE UPDATE ON public.billboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campañas_updated_at BEFORE UPDATE ON public.campañas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'role', 'advertiser'));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_reserva()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
  VALUES (NEW.owner_id, 'reserva_pendiente', 'Nueva Reserva Pendiente',
    'Tienes una nueva solicitud de reserva para ' || NEW.asset_name, NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER handle_new_reserva_trigger AFTER INSERT ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.handle_new_reserva();

CREATE OR REPLACE FUNCTION public.handle_reserva_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (NEW.advertiser_id, 'compra_aceptada', 'Reserva Aceptada',
      'Tu reserva para ' || NEW.asset_name || ' ha sido aceptada', NEW.id);
    INSERT INTO public.campañas (reserva_id, advertiser_id, nombre, presupuesto_total, dias_totales, fecha_inicio, fecha_fin)
    VALUES (NEW.id, NEW.advertiser_id, 'Campaña ' || NEW.asset_name, NEW.precio_total,
      NEW.fecha_fin - NEW.fecha_inicio + 1, NEW.fecha_inicio, NEW.fecha_fin);
  END IF;
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (NEW.advertiser_id, 'compra_rechazada', 'Reserva Rechazada',
      'Tu reserva para ' || NEW.asset_name || ' ha sido rechazada', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER handle_reserva_status_change_trigger AFTER UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.handle_reserva_status_change();
