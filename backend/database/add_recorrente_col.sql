-- Add is_recorrente column to transacoes table
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS is_recorrente BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_transacoes_is_recorrente ON transacoes(is_recorrente);
