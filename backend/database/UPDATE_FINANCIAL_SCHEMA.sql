
-- =================================================================
-- SCRIPT: ATUALIZAÇÃO FINANCEIRO (PHASE 1)
-- DATA: 2026-01-06
-- OBJETIVO: Adicionar suporte a Contas a Receber/Pagar (Status e Vencimento)
-- =================================================================

BEGIN;

-- 1. Adicionar colunas na tabela TRANSACOES
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pago', -- 'pago', 'pendente'
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- 2. Atualizar registros antigos
-- Se não tiver status, assume pago. 
update public.transacoes set status = 'pago' where status is null;

-- Se não tiver vencimento, assume a mesma data da transação
update public.transacoes set data_vencimento = data where data_vencimento is null;

-- 3. Índices para performance em filtros de status e data
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_vencimento ON public.transacoes(data_vencimento);

COMMIT;
