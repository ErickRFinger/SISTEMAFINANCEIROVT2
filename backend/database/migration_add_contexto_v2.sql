-- Adiciona coluna contexto na tabela transacoes
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS contexto VARCHAR(20) DEFAULT 'pessoal';

-- Atualiza registros existentes para 'pessoal'
UPDATE public.transacoes 
SET contexto = 'pessoal' 
WHERE contexto IS NULL;

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_contexto ON public.transacoes(contexto);
