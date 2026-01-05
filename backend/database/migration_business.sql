-- 1. Atualizar tabela USERS para suportar tipos de conta
-- Adiciona a coluna se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tipo_conta') THEN
        ALTER TABLE public.users ADD COLUMN tipo_conta VARCHAR(20) DEFAULT 'pessoal';
    END IF;
END $$;

-- 2. Tabela de FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    salario DECIMAL(15, 2) DEFAULT 0,
    data_admissao DATE DEFAULT CURRENT_DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo', -- ativo, inativo, ferias
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    empresa VARCHAR(255),
    cpf_cnpj VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de PRODUTOS (Estoque)
CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_sku VARCHAR(50),
    descricao TEXT,
    preco_custo DECIMAL(15, 2) DEFAULT 0,
    preco_venda DECIMAL(15, 2) DEFAULT 0,
    quantidade_atual INTEGER DEFAULT 0,
    quantidade_minima INTEGER DEFAULT 5, -- para alertas
    unidade_medida VARCHAR(20) DEFAULT 'un', -- un, kg, lt, cx
    categoria VARCHAR(100),
    fornecedor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de MOVIMENTAÇÃO DE ESTOQUE (Histórico)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL, -- 'entrada' ou 'saida'
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(255), -- 'compra', 'venda', 'ajuste', 'perda'
    data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    observacoes TEXT
);

-- Desabilitar RLS para evitar problemas iniciais (o backend filtra por user_id)
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque DISABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON public.funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON public.movimentacoes_estoque(produto_id);
