-- Fix create_campaign_from_reserva function to correctly calculate days
CREATE OR REPLACE FUNCTION public.create_campaign_from_reserva(reserva_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    reserva_data RECORD;
    campaign_id UUID;
    total_days INTEGER;
BEGIN
    -- Get the reserva data
    SELECT * INTO reserva_data FROM reservas WHERE id = reserva_id AND status = 'accepted';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva not found or not accepted';
    END IF;
    
    -- Calculate total days (date subtraction returns integer directly)
    total_days := (reserva_data.fecha_fin::date - reserva_data.fecha_inicio::date) + 1;
    
    -- Create the campaign
    INSERT INTO campañas (
        reserva_id,
        advertiser_id,
        nombre,
        presupuesto_total,
        dias_totales,
        fecha_inicio,
        fecha_fin
    ) VALUES (
        reserva_data.id,
        reserva_data.advertiser_id,
        'Campaña ' || reserva_data.asset_name,
        reserva_data.precio_total,
        total_days,
        reserva_data.fecha_inicio,
        reserva_data.fecha_fin
    ) RETURNING id INTO campaign_id;
    
    RETURN campaign_id;
END;
$function$;