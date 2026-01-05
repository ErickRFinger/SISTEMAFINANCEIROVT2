-- Migration V3: Add Financial fields to Kanban Cards (Demandas)

ALTER TABLE public.kanban_cards 
ADD COLUMN IF NOT EXISTS valor DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tipo_movimento VARCHAR(20) DEFAULT 'saida'; -- 'entrada' (receita) ou 'saida' (despesa/custo)

-- Optional: Link to specific products used (Many-to-Many would be better, but keeping it simple for now)
-- We will stick to the 'valor' column for the simple financial management requested.
