-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('owner', 'advertiser', 'admin')) DEFAULT 'advertiser',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservas table for booking requests
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  modalidad TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campañas table for tracking campaigns
CREATE TABLE public.campañas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  presupuesto_total DECIMAL(10,2) NOT NULL,
  presupuesto_usado DECIMAL(10,2) DEFAULT 0,
  dias_totales INTEGER NOT NULL,
  dias_transcurridos INTEGER DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notificaciones table
CREATE TABLE public.notificaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('reserva_pendiente', 'compra_aceptada', 'compra_rechazada', 'campaña_completada')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  reserva_id UUID REFERENCES public.reservas(id) ON DELETE SET NULL,
  campaña_id UUID REFERENCES public.campañas(id) ON DELETE SET NULL,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campañas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for reservas
CREATE POLICY "Users can view their own reservas" 
ON public.reservas FOR SELECT 
USING (auth.uid() = advertiser_id OR auth.uid() = owner_id);

CREATE POLICY "Advertisers can create reservas" 
ON public.reservas FOR INSERT 
WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Owners can update reserva status" 
ON public.reservas FOR UPDATE 
USING (auth.uid() = owner_id);

-- Create policies for campañas
CREATE POLICY "Users can view their own campañas" 
ON public.campañas FOR SELECT 
USING (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can create campañas" 
ON public.campañas FOR INSERT 
WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can update their campañas" 
ON public.campañas FOR UPDATE 
USING (auth.uid() = advertiser_id);

-- Create policies for notificaciones
CREATE POLICY "Users can view their own notifications" 
ON public.notificaciones FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notificaciones FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notifications" 
ON public.notificaciones FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
BEFORE UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campañas_updated_at
BEFORE UPDATE ON public.campañas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notifications when reserva status changes
CREATE OR REPLACE FUNCTION public.handle_reserva_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When owner accepts a reserva
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Notify advertiser
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (
      NEW.advertiser_id,
      'compra_aceptada',
      'Reserva Aceptada',
      'Tu reserva para ' || NEW.asset_name || ' ha sido aceptada',
      NEW.id
    );
    
    -- Create campaign
    INSERT INTO public.campañas (
      reserva_id, 
      advertiser_id, 
      nombre, 
      presupuesto_total, 
      dias_totales,
      fecha_inicio,
      fecha_fin
    )
    VALUES (
      NEW.id,
      NEW.advertiser_id,
      'Campaña ' || NEW.asset_name,
      NEW.precio_total,
      NEW.fecha_fin - NEW.fecha_inicio + 1,
      NEW.fecha_inicio,
      NEW.fecha_fin
    );
  END IF;
  
  -- When owner rejects a reserva
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (
      NEW.advertiser_id,
      'compra_rechazada',
      'Reserva Rechazada',
      'Tu reserva para ' || NEW.asset_name || ' ha sido rechazada',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reserva status changes
CREATE TRIGGER on_reserva_status_change
AFTER UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reserva_status_change();

-- Function to create notification when new reserva is created
CREATE OR REPLACE FUNCTION public.handle_new_reserva()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
  VALUES (
    NEW.owner_id,
    'reserva_pendiente',
    'Nueva Reserva Pendiente',
    'Tienes una nueva solicitud de reserva para ' || NEW.asset_name,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new reservas
CREATE TRIGGER on_new_reserva
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_reserva();

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();