-- MASTER FIX SCRIPT (V5.0)
-- 1. Cria as tabelas se não existirem
-- 2. Adiciona colunas faltantes (importante!)
-- 3. Desabilita RLS para evitar o erro de permissão

-- === 1. TABELA PRODUTOS (Estoque e Serviços) ===
CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY,
    user_id BIGINT, -- Mantendo BIGINT para compatibilidade
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_venda DECIMAL(15, 2) DEFAULT 0,
    preco_custo DECIMAL(15, 2) DEFAULT 0,
    quantidade_estoque INTEGER DEFAULT 0,
    tipo_item VARCHAR(20) DEFAULT 'produto',
    localizacao VARCHAR(100),
    margem_lucro DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(20) DEFAULT 'produto';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS localizacao VARCHAR(100);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(10, 2);

-- Desabilitar RLS (Permitir tudo)
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;


-- === 2. TABELA CLIENTES ===
CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    tipo VARCHAR(20) DEFAULT 'pessoa_fisica', -- pessoa_fisica, pessoa_juridica
    documento VARCHAR(50), -- CPF/CNPJ
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'pessoa_fisica';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- Desabilitar RLS
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;


-- === 3. KANBAN (Demandas) ===
CREATE TABLE IF NOT EXISTS public.kanban_colunas (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    titulo VARCHAR(50) NOT NULL,
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.kanban_colunas DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.kanban_cards (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    coluna_id INTEGER REFERENCES public.kanban_colunas(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade VARCHAR(20) DEFAULT 'media',
    dificuldade VARCHAR(20) DEFAULT 'medio',
    responsavel_id INTEGER,
    cliente_id INTEGER,
    data_limite DATE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    horas_estimadas DECIMAL(5, 2),
    valor DECIMAL(15, 2) DEFAULT 0,
    tipo_movimento VARCHAR(20) DEFAULT 'saida',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas críticas para o Kanban funcionar
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS tipo_movimento VARCHAR(20) DEFAULT 'saida';
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS valor DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS cliente_id INTEGER;

ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;

-- === 4. FUNCIONARIOS ===
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    salario DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;

-- MENSAGEM DE SUCESSO
SELECT 'Banco de Dados Corrigido e Travas de Segurança Removidas' as status;
