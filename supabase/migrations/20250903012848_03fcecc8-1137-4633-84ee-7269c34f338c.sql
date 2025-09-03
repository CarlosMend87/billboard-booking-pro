-- Check if triggers exist and recreate them to ensure they work properly
DROP TRIGGER IF EXISTS handle_reserva_status_change_trigger ON reservas;
DROP TRIGGER IF EXISTS handle_new_reserva_trigger ON reservas;

-- Create trigger for new reserva notifications
CREATE TRIGGER handle_new_reserva_trigger
  AFTER INSERT ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_reserva();

-- Create trigger for reserva status changes (creates campaigns when accepted)
CREATE TRIGGER handle_reserva_status_change_trigger
  AFTER UPDATE ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reserva_status_change();