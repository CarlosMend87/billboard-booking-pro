-- Create points of interest table for real POI data
CREATE TABLE public.points_of_interest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- aeropuerto, centro_comercial, estadio, hospital, universidad, etc.
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points_of_interest ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read POIs
CREATE POLICY "Anyone can view POIs" 
ON public.points_of_interest 
FOR SELECT 
USING (true);

-- Only superadmins can manage POIs
CREATE POLICY "Superadmins can manage POIs" 
ON public.points_of_interest 
FOR ALL 
USING (public.is_superadmin(auth.uid()));

-- Create index for location queries
CREATE INDEX idx_poi_tipo ON public.points_of_interest(tipo);
CREATE INDEX idx_poi_ciudad ON public.points_of_interest(ciudad);
CREATE INDEX idx_poi_coords ON public.points_of_interest(lat, lng);

-- Create updated_at trigger
CREATE TRIGGER update_points_of_interest_updated_at
BEFORE UPDATE ON public.points_of_interest
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed POI data for major Mexican cities (real coordinates)
INSERT INTO public.points_of_interest (nombre, tipo, lat, lng, direccion, ciudad) VALUES
-- Aeropuertos
('Aeropuerto Internacional de la Ciudad de México (AICM)', 'aeropuerto', 19.4363, -99.0721, 'Av. Capitán Carlos León S/N', 'CDMX'),
('Aeropuerto Internacional de Monterrey', 'aeropuerto', 25.7785, -100.1069, 'Carretera a Miguel Alemán Km 24', 'Monterrey'),
('Aeropuerto Internacional de Guadalajara', 'aeropuerto', 20.5218, -103.3111, 'Carretera Guadalajara-Chapala Km 17.5', 'Guadalajara'),
('Aeropuerto Internacional de Cancún', 'aeropuerto', 21.0365, -86.8769, 'Carretera Cancún-Chetumal Km 22', 'Cancún'),
('Aeropuerto Internacional de Mérida', 'aeropuerto', 20.9370, -89.6577, 'Carretera Mérida-Umán Km 4.5', 'Mérida'),
('Aeropuerto Internacional de Tijuana', 'aeropuerto', 32.5411, -116.9700, 'Carretera Aeropuerto S/N', 'Tijuana'),

-- Centros Comerciales CDMX
('Centro Comercial Santa Fe', 'centro_comercial', 19.3593, -99.2759, 'Vasco de Quiroga 3800', 'CDMX'),
('Perisur', 'centro_comercial', 19.3030, -99.1919, 'Anillo Periférico Sur 4690', 'CDMX'),
('Antara Polanco', 'centro_comercial', 19.4408, -99.2033, 'Av. Ejército Nacional 843-B', 'CDMX'),
('Plaza Carso', 'centro_comercial', 19.4403, -99.2055, 'Lago Zurich 245', 'CDMX'),
('Parque Delta', 'centro_comercial', 19.3926, -99.1545, 'Av. Cuauhtémoc 462', 'CDMX'),

-- Centros Comerciales Monterrey
('Galerías Monterrey', 'centro_comercial', 25.6520, -100.2891, 'Av. Insurgentes 2500', 'Monterrey'),
('Paseo San Pedro', 'centro_comercial', 25.6531, -100.4020, 'Av. Humberto Lobo 520', 'Monterrey'),
('Plaza Fiesta San Agustín', 'centro_comercial', 25.6492, -100.3582, 'Av. Real San Agustín 222', 'Monterrey'),

-- Centros Comerciales Guadalajara
('Galerías Guadalajara', 'centro_comercial', 20.6762, -103.3892, 'Av. Rafael Sanzio 150', 'Guadalajara'),
('Andares', 'centro_comercial', 20.7076, -103.4172, 'Blvd. Puerta de Hierro 4965', 'Guadalajara'),

-- Estadios CDMX
('Estadio Azteca', 'estadio', 19.3029, -99.1506, 'Calzada de Tlalpan 3465', 'CDMX'),
('Estadio Ciudad de los Deportes', 'estadio', 19.3704, -99.1759, 'Av. Cuauhtémoc 1219', 'CDMX'),
('Foro Sol', 'estadio', 19.4040, -99.0973, 'Circuito Interior', 'CDMX'),
('Palacio de los Deportes', 'estadio', 19.4028, -99.0992, 'Río Churubusco', 'CDMX'),
('Arena CDMX', 'estadio', 19.4025, -99.0960, 'Av. Río Churubusco', 'CDMX'),

-- Estadios Monterrey
('Estadio BBVA', 'estadio', 25.6698, -100.2443, 'Av. Pablo Livas 2011', 'Monterrey'),
('Estadio Universitario', 'estadio', 25.7258, -100.3134, 'Av. Universidad S/N', 'Monterrey'),

-- Estadios Guadalajara
('Estadio Akron', 'estadio', 20.6811, -103.4625, 'Av. Prolongación Alcalde 2000', 'Guadalajara'),
('Estadio Jalisco', 'estadio', 20.6863, -103.3639, 'Calle 7 2000', 'Guadalajara');

-- Create function to calculate distance between two points (in meters)
CREATE OR REPLACE FUNCTION public.calculate_distance_meters(
  lat1 NUMERIC,
  lng1 NUMERIC,
  lat2 NUMERIC,
  lng2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R NUMERIC := 6371000; -- Earth's radius in meters
  phi1 NUMERIC;
  phi2 NUMERIC;
  delta_phi NUMERIC;
  delta_lambda NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  phi1 := RADIANS(lat1);
  phi2 := RADIANS(lat2);
  delta_phi := RADIANS(lat2 - lat1);
  delta_lambda := RADIANS(lng2 - lng1);
  
  a := SIN(delta_phi / 2) * SIN(delta_phi / 2) +
       COS(phi1) * COS(phi2) * SIN(delta_lambda / 2) * SIN(delta_lambda / 2);
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  
  RETURN R * c;
END;
$$;

-- Create function to find billboards near POIs
CREATE OR REPLACE FUNCTION public.get_billboards_near_poi(
  poi_type TEXT,
  radius_meters NUMERIC DEFAULT 1000
)
RETURNS TABLE (
  billboard_id UUID,
  billboard_nombre TEXT,
  billboard_lat NUMERIC,
  billboard_lng NUMERIC,
  poi_id UUID,
  poi_nombre TEXT,
  distance_meters NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS billboard_id,
    b.nombre AS billboard_nombre,
    b.lat AS billboard_lat,
    b.lng AS billboard_lng,
    p.id AS poi_id,
    p.nombre AS poi_nombre,
    public.calculate_distance_meters(b.lat, b.lng, p.lat, p.lng) AS distance_meters
  FROM public.billboards b
  CROSS JOIN public.points_of_interest p
  WHERE 
    p.tipo = poi_type
    AND b.status = 'disponible'
    AND public.calculate_distance_meters(b.lat, b.lng, p.lat, p.lng) <= radius_meters
  ORDER BY distance_meters ASC;
END;
$$;