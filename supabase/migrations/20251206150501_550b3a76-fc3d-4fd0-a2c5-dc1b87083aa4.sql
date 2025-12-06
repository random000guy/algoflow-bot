-- Add priority column to market_data_configs for provider ordering
ALTER TABLE public.market_data_configs 
ADD COLUMN priority integer DEFAULT 1;

-- Update existing rows to have sequential priorities based on is_active (active ones get priority 1)
UPDATE public.market_data_configs 
SET priority = CASE WHEN is_active = true THEN 1 ELSE 2 END;