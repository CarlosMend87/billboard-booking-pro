-- Add Computer Vision / AdMobilize support to billboards table
ALTER TABLE billboards 
ADD COLUMN has_computer_vision boolean DEFAULT false,
ADD COLUMN admobilize_config jsonb DEFAULT NULL,
ADD COLUMN last_detection_count integer DEFAULT 0,
ADD COLUMN last_detection_date date DEFAULT NULL;

COMMENT ON COLUMN billboards.has_computer_vision IS 'Indica si la pantalla tiene tecnología de Computer Vision (AdMobilize)';
COMMENT ON COLUMN billboards.admobilize_config IS 'Configuración de AdMobilize (device_id, api_key, etc.)';
COMMENT ON COLUMN billboards.last_detection_count IS 'Cantidad de personas detectadas el día anterior';
COMMENT ON COLUMN billboards.last_detection_date IS 'Fecha de la última detección registrada';