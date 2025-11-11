-- Fix search_path for notification functions (security issue)
CREATE OR REPLACE FUNCTION public.handle_reserva_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- When owner accepts a reserva
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
      -- Check if notification already exists to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM public.notificaciones 
        WHERE reserva_id = NEW.id 
        AND tipo = 'compra_aceptada'
        AND user_id = NEW.advertiser_id
      ) THEN
        -- Notify advertiser
        INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
        VALUES (
          NEW.advertiser_id,
          'compra_aceptada',
          'Reserva Aceptada',
          'Tu reserva para ' || NEW.asset_name || ' ha sido aceptada',
          NEW.id
        );
      END IF;

      -- Create campaign from reserva
      INSERT INTO public.campañas (
        nombre,
        advertiser_id,
        presupuesto_total,
        fecha_inicio,
        fecha_fin,
        duracion_dias,
        status,
        reserva_id
      )
      VALUES (
        'Campaña ' || NEW.asset_name,
        NEW.advertiser_id,
        NEW.precio_total,
        NEW.fecha_inicio,
        NEW.fecha_fin,
        EXTRACT(day FROM (NEW.fecha_fin::timestamp - NEW.fecha_inicio::timestamp)),
        'active',
        NEW.id
      );
    END IF;

    -- When owner rejects a reserva
    IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      -- Check if notification already exists
      IF NOT EXISTS (
        SELECT 1 FROM public.notificaciones 
        WHERE reserva_id = NEW.id 
        AND tipo = 'compra_rechazada'
        AND user_id = NEW.advertiser_id
      ) THEN
        -- Notify advertiser
        INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
        VALUES (
          NEW.advertiser_id,
          'compra_rechazada',
          'Reserva Rechazada',
          'Tu reserva para ' || NEW.asset_name || ' ha sido rechazada',
          NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_reserva()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if notification already exists to avoid duplicates
  IF NOT EXISTS (
    SELECT 1 FROM public.notificaciones 
    WHERE reserva_id = NEW.id 
    AND tipo = 'reserva_pendiente'
    AND user_id = NEW.owner_id
  ) THEN
    INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, reserva_id)
    VALUES (
      NEW.owner_id,
      'reserva_pendiente',
      'Nueva Reserva Pendiente',
      'Tienes una nueva solicitud de reserva para ' || NEW.asset_name,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Add DELETE policy for notifications so users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notificaciones
FOR DELETE
USING (auth.uid() = user_id);