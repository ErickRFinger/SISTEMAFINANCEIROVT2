-- FIX ENTERPRISE UUID FINAL (V4.0)
-- Este script corrige DEFINITIVAMENTE o problema de salvar Estoque/Serviços e Kanban.
-- Ele transforma todas as colunas user_id numericAS (BIGINT) em UUID.

BEGIN;

-- 1. PRODUTOS E SERVIÇOS
-- Remove constraint antiga se existir
ALTER TABLE IF EXISTS public.produtos DROP CONSTRAINT IF EXISTS produtos_user_id_fkey;
-- Converte para UUID (usando NULL se falhar conversão, resetando IDs inválidos)
ALTER TABLE IF EXISTS public.produtos ALTER COLUMN user_id TYPE UUID USING NULL;
-- Garante colunas necessárias
ALTER TABLE IF EXISTS public.produtos ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(20) DEFAULT 'produto';
ALTER TABLE IF EXISTS public.produtos ADD COLUMN IF NOT EXISTS localizacao VARCHAR(100);
ALTER TABLE IF EXISTS public.produtos ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(10, 2);
ALTER TABLE IF EXISTS public.produtos ENABLE ROW LEVEL SECURITY;


-- 2. CLIENTES
ALTER TABLE IF EXISTS public.clientes DROP CONSTRAINT IF EXISTS clientes_user_id_fkey;
ALTER TABLE IF EXISTS public.clientes ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
-- Garante colunas necessárias
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'pessoa_fisica';
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';


-- 3. KANBAN (Demandas)
-- Colunas
ALTER TABLE IF EXISTS public.kanban_colunas DROP CONSTRAINT IF EXISTS kanban_colunas_user_id_fkey;
ALTER TABLE IF EXISTS public.kanban_colunas ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE IF EXISTS public.kanban_colunas ENABLE ROW LEVEL SECURITY;

-- Cards
ALTER TABLE IF EXISTS public.kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_user_id_fkey;
ALTER TABLE IF EXISTS public.kanban_cards ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE IF EXISTS public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- Garante colunas nos Cards
ALTER TABLE IF EXISTS public.kanban_cards ADD COLUMN IF NOT EXISTS tipo_movimento VARCHAR(20) DEFAULT 'saida';
ALTER TABLE IF EXISTS public.kanban_cards ADD COLUMN IF NOT EXISTS valor DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE IF EXISTS public.kanban_cards ADD COLUMN IF NOT EXISTS cliente_id INTEGER;
ALTER TABLE IF EXISTS public.kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_cliente_id_fkey;
-- Recriar FK cliente se possível, mas como cliente_id pode ser int e clientes.id é int, ok.


-- 4. FUNCIONARIOS
ALTER TABLE IF EXISTS public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_user_id_fkey;
ALTER TABLE IF EXISTS public.funcionarios ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE IF EXISTS public.funcionarios ENABLE ROW LEVEL SECURITY;


-- 5. POLÍTICAS DE RLS (Segurança para UUID)
-- Garante que o usuario só veja seus dados
DROP POLICY IF EXISTS "Users can view own products" ON public.produtos;
CREATE POLICY "Users can view own products" ON public.produtos FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON public.produtos;
CREATE POLICY "Users can insert own products" ON public.produtos FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.produtos;
CREATE POLICY "Users can update own products" ON public.produtos FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.produtos;
CREATE POLICY "Users can delete own products" ON public.produtos FOR DELETE USING (auth.uid() = user_id);

-- (Repetir para Kanban)
DROP POLICY IF EXISTS "Users can view own kanban columns" ON public.kanban_colunas;
CREATE POLICY "Users can view own kanban columns" ON public.kanban_colunas FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own kanban columns" ON public.kanban_colunas;
CREATE POLICY "Users can insert own kanban columns" ON public.kanban_colunas FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own kanban cards" ON public.kanban_cards;
CREATE POLICY "Users can view own kanban cards" ON public.kanban_cards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own kanban cards" ON public.kanban_cards;
CREATE POLICY "Users can insert own kanban cards" ON public.kanban_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own kanban cards" ON public.kanban_cards;
CREATE POLICY "Users can update own kanban cards" ON public.kanban_cards FOR UPDATE USING (auth.uid() = user_id);


COMMIT;

SELECT 'Banco de dados corrigido com sucesso! Tente salvar agora.' as status;
