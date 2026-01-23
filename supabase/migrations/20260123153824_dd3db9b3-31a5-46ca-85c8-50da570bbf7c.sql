-- Add last_activity_at to user_carts for abandoned cart tracking
ALTER TABLE public.user_carts 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create propuestas table for saving multiple cart proposals
CREATE TABLE public.propuestas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_dates JSONB,
  total_estimado NUMERIC(12,2) DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;

-- Create policies for propuestas
CREATE POLICY "Users can view their own proposals" 
ON public.propuestas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proposals" 
ON public.propuestas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals" 
ON public.propuestas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals" 
ON public.propuestas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_propuestas_updated_at
BEFORE UPDATE ON public.propuestas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_propuestas_user_id ON public.propuestas(user_id);
CREATE INDEX idx_user_carts_abandoned ON public.user_carts(last_activity_at) WHERE reminder_sent_at IS NULL;