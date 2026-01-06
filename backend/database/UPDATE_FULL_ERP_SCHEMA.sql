
-- =================================================================
-- SCRIPT: ATUALIZAÇÃO ERP COMPLETO (PHASE 2 & 3)
-- DATA: 2026-01-06
-- OBJETIVO: Suporte a Estoque Mínimo e Analytics
-- =================================================================

BEGIN;

-- 1. Melhoria na Tabela de Produtos (Estoque Inteligente)
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 5;

-- 2. Índices para Analytics (BI)
-- Índices para agrupamentos rápidos
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto ON public.itens_venda(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas(data_venda);

COMMIT;
