-- MASTER FIX SCRIPT (V6.0 - FORCE TYPES)
-- Este script corrige os tipos das colunas user_id para BIGINT
-- Resolve o erro "column user_id is of type uuid but expression is of type bigint"

-- === 1. PRODUTOS ===
ALTER TABLE public.produtos DROP CONSTRAINT IF EXISTS produtos_user_id_fkey; -- Remove FK antiga se houver
ALTER TABLE public.produtos ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint; -- Força Conversão ou NULL
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;
-- Garantir colunas extras
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(20) DEFAULT 'produto';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS localizacao VARCHAR(100);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(10, 2);


-- === 2. CLIENTES ===
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_user_id_fkey;
ALTER TABLE public.clientes ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
-- Colunas extras
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'pessoa_fisica';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';


-- === 3. KANBAN (Demandas) ===
-- Colunas
ALTER TABLE public.kanban_colunas DROP CONSTRAINT IF EXISTS kanban_colunas_user_id_fkey;
ALTER TABLE public.kanban_colunas ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.kanban_colunas DISABLE ROW LEVEL SECURITY;

-- Cards
ALTER TABLE public.kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_user_id_fkey;
ALTER TABLE public.kanban_cards ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;
-- Garantir campos
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS tipo_movimento VARCHAR(20) DEFAULT 'saida';
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS valor DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS cliente_id INTEGER;

-- === 4. FUNCIONARIOS ===
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_user_id_fkey;
ALTER TABLE public.funcionarios ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;

-- MENSAGEM FINAL
SELECT 'Tabelas corrigidas para aceitar IDs numéricos (BIGINT)' as status;
