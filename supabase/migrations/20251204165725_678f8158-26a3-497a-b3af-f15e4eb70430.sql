-- Create trade_journal table for logging trades with notes and automatic P&L tracking
CREATE TABLE public.trade_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  tags TEXT[],
  screenshot_url TEXT,
  strategy TEXT,
  pnl NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN exit_price IS NOT NULL AND action = 'BUY' THEN (exit_price - entry_price) * quantity
      WHEN exit_price IS NOT NULL AND action = 'SELL' THEN (entry_price - exit_price) * quantity
      ELSE NULL
    END
  ) STORED,
  pnl_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN exit_price IS NOT NULL AND action = 'BUY' THEN ((exit_price - entry_price) / entry_price) * 100
      WHEN exit_price IS NOT NULL AND action = 'SELL' THEN ((entry_price - exit_price) / entry_price) * 100
      ELSE NULL
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own journal entries" 
ON public.trade_journal 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries" 
ON public.trade_journal 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.trade_journal 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.trade_journal 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trade_journal_updated_at
BEFORE UPDATE ON public.trade_journal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();