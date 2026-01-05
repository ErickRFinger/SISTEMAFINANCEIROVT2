-- MIGRATION FINAL PRODUCTION (V3.0)
-- Execute este script no SQL Editor do Supabase para garantir que TODAS as tabelas e campos existam.

-- 1. Atualizar Tabela USERS (Se não existir campos)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tipo_conta VARCHAR(20) DEFAULT 'pessoal'; -- pessoal, empresarial, hibrido

-- 2. Tabela FUNCIONARIOS
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    salario DECIMAL(15, 2) DEFAULT 0,
    data_admissao DATE DEFAULT CURRENT_DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    tipo_pessoa VARCHAR(10) DEFAULT 'PF', -- PF ou PJ
    documento VARCHAR(50), -- CPF ou CNPJ
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela PRODUTOS (serve para Estoque e Serviços)
CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
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

-- 5. Tabela KANBAN_COLUNAS
CREATE TABLE IF NOT EXISTS public.kanban_colunas (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    titulo VARCHAR(50) NOT NULL,
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela KANBAN_CARDS (Tarefas / Demandas)
CREATE TABLE IF NOT EXISTS public.kanban_cards (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    coluna_id INTEGER REFERENCES public.kanban_colunas(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade VARCHAR(20) DEFAULT 'media', -- baixa, media, alta
    dificuldade VARCHAR(20) DEFAULT 'medio', -- facil, medio, dificil
    responsavel_id INTEGER REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL,
    data_limite DATE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    horas_estimadas DECIMAL(5, 2),
    valor DECIMAL(15, 2) DEFAULT 0, -- Valor da demanda/serviço
    tipo_movimento VARCHAR(20) DEFAULT 'saida', -- entrada, saida
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Fix de Performance (Indices)
CREATE INDEX IF NOT EXISTS idx_kanban_cards_user ON public.kanban_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_user ON public.produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user ON public.clientes(user_id);

-- 8. Permissões (Garantir acesso)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
