-- Fix duplicate triggers causing multiple campaign creation
-- Drop old duplicate triggers
DROP TRIGGER IF EXISTS on_new_reserva ON public.reservas;
DROP TRIGGER IF EXISTS on_reserva_status_change ON public.reservas;

-- Keep only the correctly named triggers (already exist from previous migration)
-- handle_new_reserva_trigger and handle_reserva_status_change_trigger are correct