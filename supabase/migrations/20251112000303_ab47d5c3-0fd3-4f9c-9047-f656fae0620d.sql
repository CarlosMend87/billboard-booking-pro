-- Fix the trigger function to use dias_totales instead of duracion_dias
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

      -- Create campaign from reserva using dias_totales
      INSERT INTO public.campañas (
        nombre,
        advertiser_id,
        presupuesto_total,
        fecha_inicio,
        fecha_fin,
        dias_totales,
        status,
        reserva_id
      )
      VALUES (
        'Campaña ' || NEW.asset_name,
        NEW.advertiser_id,
        NEW.precio_total,
        NEW.fecha_inicio,
        NEW.fecha_fin,
        EXTRACT(day FROM (NEW.fecha_fin::timestamp - NEW.fecha_inicio::timestamp)) + 1,
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

-- Clean up test data - delete all reservas except the two the user wants to keep
DELETE FROM public.reservas 
WHERE id NOT IN (
  'df370d87-cd5b-429a-89d6-31f4829fea90',  -- Plaza de la construcción (pending)
  '063b0862-89ff-4c8c-b5d2-1f235be2b0c1'   -- Brisquets Obregn (accepted)
);

-- Clean up associated campaigns except the one for Brisquets Obregn
DELETE FROM public.campañas 
WHERE id != '0aa2c307-3202-41ed-b991-ad299117846e';