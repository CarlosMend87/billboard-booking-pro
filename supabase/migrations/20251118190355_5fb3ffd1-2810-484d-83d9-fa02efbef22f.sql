-- Arreglar search_path en funciones nuevas
CREATE OR REPLACE FUNCTION public.update_codigos_descuento_updated_at()
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

CREATE OR REPLACE FUNCTION public.incrementar_uso_codigo_descuento(codigo_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.codigos_descuento
  SET uso_actual = uso_actual + 1
  WHERE id = codigo_id;
END;
$$;