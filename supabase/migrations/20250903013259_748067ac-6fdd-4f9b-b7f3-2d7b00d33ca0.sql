-- Let's test manually creating a campaign when a reserva is accepted
-- First, let's check if we have any accepted reservas and manually create a campaign

-- Create a simple function that can be called manually to create campaigns
CREATE OR REPLACE FUNCTION create_campaign_from_reserva(reserva_id UUID)
RETURNS UUID AS $$
DECLARE
    reserva_data RECORD;
    campaign_id UUID;
BEGIN
    -- Get the reserva data
    SELECT * INTO reserva_data FROM reservas WHERE id = reserva_id AND status = 'accepted';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva not found or not accepted';
    END IF;
    
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
        EXTRACT(days FROM (reserva_data.fecha_fin::date - reserva_data.fecha_inicio::date)) + 1,
        reserva_data.fecha_inicio,
        reserva_data.fecha_fin
    ) RETURNING id INTO campaign_id;
    
    RETURN campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;