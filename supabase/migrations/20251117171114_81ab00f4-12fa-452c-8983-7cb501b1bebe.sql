-- Create strategies table for custom trading algorithms
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on strategies
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- Create policies for strategies
CREATE POLICY "Users can view their own strategies"
ON public.strategies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own strategies"
ON public.strategies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
ON public.strategies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
ON public.strategies
FOR DELETE
USING (auth.uid() = user_id);

-- Create paper trading accounts table
CREATE TABLE public.paper_trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  starting_balance NUMERIC NOT NULL DEFAULT 100000,
  current_balance NUMERIC NOT NULL DEFAULT 100000,
  total_pnl NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on paper trading accounts
ALTER TABLE public.paper_trading_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for paper trading accounts
CREATE POLICY "Users can view their own paper accounts"
ON public.paper_trading_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own paper accounts"
ON public.paper_trading_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paper accounts"
ON public.paper_trading_accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Create paper trading positions table
CREATE TABLE public.paper_trading_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.paper_trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  current_price NUMERIC,
  pnl NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on paper trading positions
ALTER TABLE public.paper_trading_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for paper trading positions
CREATE POLICY "Users can view their paper positions"
ON public.paper_trading_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.paper_trading_accounts
    WHERE id = paper_trading_positions.account_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their paper positions"
ON public.paper_trading_positions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.paper_trading_accounts
    WHERE id = paper_trading_positions.account_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their paper positions"
ON public.paper_trading_positions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.paper_trading_accounts
    WHERE id = paper_trading_positions.account_id
    AND user_id = auth.uid()
  )
);

-- Add trigger for updated_at on strategies
CREATE TRIGGER update_strategies_updated_at
BEFORE UPDATE ON public.strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on paper trading accounts
CREATE TRIGGER update_paper_accounts_updated_at
BEFORE UPDATE ON public.paper_trading_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();