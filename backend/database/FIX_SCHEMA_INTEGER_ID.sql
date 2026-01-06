-- =================================================================
-- SCRIPT "CORREÇÃO DEFINITIVA DE TIPO" (FIX SCHEMA INTEGER ID)
-- DATA: 2026-01-05
-- OBJETIVO: Corrigir erro "invalid input syntax for type uuid"
-- MOTIVO: O sistema usa uma tabela 'users' própria com ID numérico (Ex: 8), não UUID.
-- =================================================================

BEGIN;

-- 1. LIMPEZA (Apaga tabelas criadas com tipo errado)
DROP TABLE IF EXISTS public.kanban_cards CASCADE;
DROP TABLE IF EXISTS public.kanban_colunas CASCADE;
DROP TABLE IF EXISTS public.produtos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.funcionarios CASCADE;

-- 2. RECRIAR TABELAS (Agora com user_id do tipo INTEGER/BIGINT)

-- Tabela Funcionários
CREATE TABLE public.funcionarios (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,             -- CORRIGIDO: BIGINT para aceitar IDs como "8"
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    salario DECIMAL(15, 2) DEFAULT 0,
    data_admissao DATE DEFAULT CURRENT_DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Clientes
CREATE TABLE public.clientes (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,             -- CORRIGIDO: BIGINT
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    tipo_pessoa VARCHAR(50) DEFAULT 'PF',
    documento VARCHAR(50),
    endereco TEXT,
    tipo VARCHAR(20) DEFAULT 'pessoa_fisica', -- Mantendo compatibilidade legada
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Produtos (Estoque/Serviços)
CREATE TABLE public.produtos (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,             -- CORRIGIDO: BIGINT
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_venda DECIMAL(15, 2) DEFAULT 0,
    preco_custo DECIMAL(15, 2) DEFAULT 0,
    quantidade_estoque INTEGER DEFAULT 0,
    tipo_item VARCHAR(20) DEFAULT 'produto', -- 'produto' ou 'servico'
    localizacao VARCHAR(100),
    margem_lucro DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Kanban Colunas
CREATE TABLE public.kanban_colunas (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,             -- CORRIGIDO: BIGINT
    titulo VARCHAR(50) NOT NULL,
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Kanban Cards
CREATE TABLE public.kanban_cards (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,             -- CORRIGIDO: BIGINT
    coluna_id INTEGER REFERENCES public.kanban_colunas(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade VARCHAR(20) DEFAULT 'media',
    dificuldade VARCHAR(20) DEFAULT 'medio',
    responsavel_id INTEGER REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL,
    data_limite DATE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    horas_estimadas DECIMAL(5, 2),
    valor DECIMAL(15, 2) DEFAULT 0,
    tipo_movimento VARCHAR(20) DEFAULT 'saida',
    posicao INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. FUNÇÃO AUXILIAR (Kanban Reorder - Atualizada para BIGINT)
CREATE OR REPLACE FUNCTION increment_card_position(p_coluna_id INTEGER, p_min_pos INTEGER, p_user_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.kanban_cards
  SET posicao = posicao + 1
  WHERE coluna_id = p_coluna_id
    AND posicao >= p_min_pos
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 4. PERMISSÕES E SECURITY
-- Desabilita RLS (O backend controla o acesso via WHERE user_id = X)
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_colunas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;

-- Garante permissões (Super Permissivo para evitar erros 403)
GRANT ALL ON TABLE public.produtos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clientes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.funcionarios TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.kanban_colunas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.kanban_cards TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

COMMIT;
