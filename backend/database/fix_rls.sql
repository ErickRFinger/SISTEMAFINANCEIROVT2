-- DISABLE RLS because the tables use BigInt IDs (Custom Auth) 
-- and do not match Supabase Auth UUIDs.
-- The Node.js backend handles security/authorization internally.

ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_colunas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque DISABLE ROW LEVEL SECURITY;

-- If you ever switch to pure UUID Supabase Auth, you will need to migrate user_id to UUID.
