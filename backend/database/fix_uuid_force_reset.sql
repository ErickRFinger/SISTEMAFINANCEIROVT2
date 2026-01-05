-- FORCE RESET SCRIPT (UUID FIX V2)
-- Este script CORRIGE o erro "invalid input syntax for type uuid".
-- Ele converte o user_id para UUID definindo como NULL os valores antigos (numéricos) que não são compatíveis.

-- 1. PRODUTOS
ALTER TABLE public.produtos DROP CONSTRAINT IF EXISTS produtos_user_id_fkey;
-- O segredo está aqui: USING NULL ignora o "8" que estava dando erro e deixa o campo vazio por enquanto
ALTER TABLE public.produtos ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;
-- Garantir colunas
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(20) DEFAULT 'produto';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS localizacao VARCHAR(100);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(10, 2);

-- 2. CLIENTES
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_user_id_fkey;
ALTER TABLE public.clientes ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
-- Garantir colunas
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'pessoa_fisica';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- 3. KANBAN
ALTER TABLE public.kanban_colunas DROP CONSTRAINT IF EXISTS kanban_colunas_user_id_fkey;
ALTER TABLE public.kanban_colunas ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.kanban_colunas DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_user_id_fkey;
ALTER TABLE public.kanban_cards ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;
-- Garantir colunas
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS tipo_movimento VARCHAR(20) DEFAULT 'saida';
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS valor DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS cliente_id INTEGER;

-- 4. FUNCIONARIOS
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_user_id_fkey;
ALTER TABLE public.funcionarios ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;

SELECT 'Sucesso! Tabelas convertidas para UUID. (IDs antigos foram resetados para NULL)' as status;
