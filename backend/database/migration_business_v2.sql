-- ==============================================================================
-- MIGRATION V2 - ERP EMPRESARIAL COMPLETO
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ATUALIZAÇÕES NA TABELA DE TRANSAÇÕES (FINANCEIRO)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Adicionar Status do Pagamento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'status_pagamento') THEN
        ALTER TABLE public.transacoes ADD COLUMN status_pagamento VARCHAR(20) DEFAULT 'realizado'; -- 'aberto', 'pago', 'vencido', 'cancelado'
    END IF;

    -- Adicionar Data de Vencimento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'data_vencimento') THEN
        ALTER TABLE public.transacoes ADD COLUMN data_vencimento DATE;
    END IF;

    -- Adicionar Data de Pagamento Real
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'data_pagamento') THEN
        ALTER TABLE public.transacoes ADD COLUMN data_pagamento DATE DEFAULT CURRENT_DATE;
    END IF;

    -- Adicionar Cliente/Fornecedor (FK)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'cliente_id') THEN
        ALTER TABLE public.transacoes ADD COLUMN cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL;
    END IF;

    -- Adicionar URL do Comprovante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'comprovante_url') THEN
        ALTER TABLE public.transacoes ADD COLUMN comprovante_url TEXT;
    END IF;

    -- Adicionar Centro de Custo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'centro_custo') THEN
        ALTER TABLE public.transacoes ADD COLUMN centro_custo VARCHAR(100);
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. ATUALIZAÇÕES NO CRM (CLIENTES) E INTERAÇÕES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Tipo de Pessoa (PF/PJ)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'tipo_pessoa') THEN
        ALTER TABLE public.clientes ADD COLUMN tipo_pessoa VARCHAR(10) DEFAULT 'PF';
    END IF;

    -- Origem (Marketing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'origem') THEN
        ALTER TABLE public.clientes ADD COLUMN origem VARCHAR(100); -- 'Instagram', 'Google', 'Indicação'
    END IF;
END $$;

-- Tabela de Histórico de Interações (Timeline)
CREATE TABLE IF NOT EXISTS public.crm_interacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE, -- Quem fez a interação
    tipo VARCHAR(50) NOT NULL, -- 'ligacao', 'whatsapp', 'email', 'reuniao', 'proposta'
    resumo TEXT,
    data_interacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_interacoes_cliente_id ON public.crm_interacoes(cliente_id);


-- ------------------------------------------------------------------------------
-- 3. MÓDULO DE CONTRATOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contratos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE,
    titulo VARCHAR(255),
    
    valor_mensal DECIMAL(15, 2) DEFAULT 0,
    dia_vencimento INTEGER, -- Ex: 10, 15, 20
    
    data_inicio DATE,
    data_fim DATE,
    
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'suspenso', 'cancelado', 'encerrado'
    
    indice_reajuste VARCHAR(20), -- 'IGPM', 'IPCA'
    mes_reajuste INTEGER, -- 1 a 12
    
    contrato_url TEXT, -- Link para o PDF
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contratos_user_id ON public.contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON public.contratos(cliente_id);


-- ------------------------------------------------------------------------------
-- 4. ATUALIZAÇÕES NO ESTOQUE (PRODUTOS) E KITS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Tipo (Produto ou Serviço)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'tipo_item') THEN
        ALTER TABLE public.produtos ADD COLUMN tipo_item VARCHAR(20) DEFAULT 'produto';
    END IF;

    -- Margem de Lucro (%)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'margem_lucro') THEN
        ALTER TABLE public.produtos ADD COLUMN margem_lucro DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Localização Física
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'localizacao') THEN
        ALTER TABLE public.produtos ADD COLUMN localizacao VARCHAR(100);
    END IF;
END $$;

-- Tabela de Kits/Combos (NxN)
-- Ex: Kit Câmeras (Pai) contém 4x Câmera (Filho) + 1x DVR (Filho)
CREATE TABLE IF NOT EXISTS public.produto_kits (
    id SERIAL PRIMARY KEY,
    produto_pai_id INTEGER REFERENCES public.produtos(id) ON DELETE CASCADE,
    produto_filho_id INTEGER REFERENCES public.produtos(id) ON DELETE CASCADE,
    quantidade DECIMAL(10, 2) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_produto_kits_pai ON public.produto_kits(produto_pai_id);


-- ------------------------------------------------------------------------------
-- 5. MÓDULO OPERACIONAL (KANBAN)
-- ------------------------------------------------------------------------------

-- Colunas do Kanban (Fases)
CREATE TABLE IF NOT EXISTS public.kanban_colunas (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL, -- 'A Fazer', 'Em Execução', 'Concluído'
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Card/Tarefa
CREATE TABLE IF NOT EXISTS public.kanban_cards (
    id SERIAL PRIMARY KEY,
    coluna_id INTEGER REFERENCES public.kanban_colunas(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE, -- Dono do quadro
    
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    
    prioridade VARCHAR(20) DEFAULT 'media', -- 'alta', 'media', 'baixa'
    dificuldade VARCHAR(20), -- 'facil', 'medio', 'dificil'
    
    responsavel_id INTEGER REFERENCES public.funcionarios(id) ON DELETE SET NULL, -- Quem executa
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL, -- Cliente relacionado
    
    data_limite DATE,
    horas_estimadas DECIMAL(5, 2),
    horas_realizadas DECIMAL(5, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_coluna ON public.kanban_cards(coluna_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_user ON public.kanban_cards(user_id);

-- Checklist dentro do Card
CREATE TABLE IF NOT EXISTS public.kanban_checklists (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
    texto VARCHAR(255) NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS DE SEGURANÇA (RLS) - DESATIVANDO PARA EVITAR BLOQUEIOS
-- ------------------------------------------------------------------------------
ALTER TABLE public.crm_interacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_colunas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_checklists DISABLE ROW LEVEL SECURITY;
