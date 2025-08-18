-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_reserva_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_reserva()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;