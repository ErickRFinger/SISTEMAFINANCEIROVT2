-- =================================================================
-- SCRIPT "ERP ORCAMENTOS" (MÓDULO DE PROPOSTAS)
-- DATA: 2026-01-05
-- OBJETIVO: Criar tabelas para Orçamentos (Rascunho de Venda)
-- COMPATIBILIDADE: Baseado no schema INTEGER_ID
-- =================================================================

BEGIN;

-- 1. TABELA DE ORÇAMENTOS (Cabeçalho)
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,              -- Dono da proposta
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_validade DATE,                    -- Até quando vale
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, aprovado, rejeitado, expirado
    valor_total DECIMAL(15, 2) DEFAULT 0,
    desconto DECIMAL(15, 2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE ITENS DO ORÇAMENTO
CREATE TABLE IF NOT EXISTS public.itens_orcamento (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    orcamento_id INTEGER REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES public.produtos(id) ON DELETE SET NULL,
    nome_produto VARCHAR(255),             -- Snapshot do nome
    quantidade INTEGER DEFAULT 1,
    preco_unitario DECIMAL(15, 2) DEFAULT 0,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERMISSÕES E SECURITY
ALTER TABLE public.orcamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_orcamento DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.orcamentos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.itens_orcamento TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_orcamentos_user ON public.orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON public.orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_orcamento ON public.itens_orcamento(orcamento_id);

COMMIT;
