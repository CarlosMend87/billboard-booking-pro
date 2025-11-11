-- Fix 1: Allow advertisers to delete their own campañas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campañas' AND policyname = 'Advertisers can delete their campañas'
  ) THEN
    CREATE POLICY "Advertisers can delete their campañas"
    ON public.campañas
    FOR DELETE
    USING (auth.uid() = advertiser_id);
  END IF;
END $$;

-- Fix 2: Ensure automatic campaign creation on reserva events (single, idempotent triggers)
DROP TRIGGER IF EXISTS handle_reserva_status_change_trigger ON public.reservas;
CREATE TRIGGER handle_reserva_status_change_trigger
AFTER UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_reserva_status_change();

DROP TRIGGER IF EXISTS handle_new_reserva_trigger ON public.reservas;
CREATE TRIGGER handle_new_reserva_trigger
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_reserva();