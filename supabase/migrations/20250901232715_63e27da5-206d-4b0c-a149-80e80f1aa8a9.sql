-- Análisis de seguridad y corrección de la tabla profiles
-- 
-- PROBLEMA IDENTIFICADO:
-- La tabla profiles tiene una estructura no estándar que puede causar confusión
-- y potenciales vulnerabilidades de seguridad
--
-- SOLUCIÓN:
-- 1. Reestructurar la tabla para seguir las mejores prácticas de Supabase
-- 2. Hacer que el campo id sea directamente el user_id de auth
-- 3. Actualizar las políticas RLS para mayor claridad
-- 4. Agregar política DELETE faltante

-- Paso 1: Crear una nueva tabla con la estructura correcta
CREATE TABLE public.profiles_new (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role text DEFAULT 'advertiser'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Paso 2: Migrar datos existentes (usando user_id como nuevo id)
INSERT INTO public.profiles_new (id, name, email, role, created_at, updated_at)
SELECT user_id, name, email, role, created_at, updated_at 
FROM public.profiles;

-- Paso 3: Eliminar tabla antigua
DROP TABLE public.profiles;

-- Paso 4: Renombrar nueva tabla
ALTER TABLE public.profiles_new RENAME TO profiles;

-- Paso 5: Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Paso 6: Crear políticas RLS mejoradas y más seguras
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Paso 7: Actualizar trigger para nuevos usuarios (si existe)
-- Verificar si el trigger handle_new_user necesita actualización
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recrear función actualizada para la nueva estructura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'advertiser')
  );
  RETURN NEW;
END;
$$;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 8: Agregar trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();