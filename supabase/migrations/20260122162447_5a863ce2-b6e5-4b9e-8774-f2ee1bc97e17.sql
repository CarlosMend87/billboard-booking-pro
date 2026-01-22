-- Create table for persistent user cart
CREATE TABLE public.user_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_dates JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cart
CREATE POLICY "Users can view their own cart"
ON public.user_carts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own cart
CREATE POLICY "Users can create their own cart"
ON public.user_carts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update their own cart"
ON public.user_carts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own cart
CREATE POLICY "Users can delete their own cart"
ON public.user_carts
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_carts_updated_at
BEFORE UPDATE ON public.user_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.user_carts IS 'Stores user shopping cart data for persistence across devices and sessions';