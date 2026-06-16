CREATE OR REPLACE FUNCTION public.get_available_billboards(p_start_date date, p_end_date date)
RETURNS SETOF public.billboards
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.*
  FROM public.billboards b
  WHERE b.status = 'disponible'
    AND NOT EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.asset_name = b.nombre
        AND r.status IN ('pending','accepted')
        AND r.fecha_inicio <= p_end_date
        AND r.fecha_fin >= p_start_date
    )
  ORDER BY b.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_billboards(date, date) TO anon, authenticated;