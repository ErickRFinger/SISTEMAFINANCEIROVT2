-- =================================================================
-- SCRIPT "ERP SETUP" (MÓDULO DE VENDAS)
-- DATA: 2026-01-05
-- OBJETIVO: Criar tabelas para Vendas e Itens de Venda
-- COMPATIBILIDADE: Baseado no schema INTEGER_ID (user_id BIGINT)
-- =================================================================

BEGIN;

-- 1. TABELA DE VENDAS (Cabeçalho)
CREATE TABLE IF NOT EXISTS public.vendas (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,              -- Dono da venda (Empresa)
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(20) DEFAULT 'concluiu', -- pendente, concluiu, cancelada
    valor_total DECIMAL(15, 2) DEFAULT 0,
    desconto DECIMAL(15, 2) DEFAULT 0,
    forma_pagamento VARCHAR(50),           -- Dinheiro, PIX, Cartão Crédito, etc
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE ITENS DA VENDA (Detalhes)
CREATE TABLE IF NOT EXISTS public.itens_venda (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,               -- Redundância útil para segurança RLS/Queries
    venda_id INTEGER REFERENCES public.vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES public.produtos(id) ON DELETE SET NULL,
    nome_produto VARCHAR(255),             -- Copiamos o nome caso o produto seja deletado depois
    quantidade INTEGER DEFAULT 1,
    preco_unitario DECIMAL(15, 2) DEFAULT 0, -- Preço NO MOMENTO da venda
    subtotal DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERMISSÕES E SECURITY
ALTER TABLE public.vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.vendas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.itens_venda TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_vendas_user ON public.vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON public.itens_venda(venda_id);

COMMIT;
