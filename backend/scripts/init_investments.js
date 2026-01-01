import supabase from '../database/db.js';

const initInvestimentos = async () => {
    console.log('🔄 Inicializando tabela de investimentos...');

    const schema = `
    CREATE TABLE IF NOT EXISTS public.investimentos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        instituicao VARCHAR(100),
        valor_investido DECIMAL(15, 2) NOT NULL DEFAULT 0,
        valor_atual DECIMAL(15, 2) NOT NULL DEFAULT 0,
        data_aplicacao DATE DEFAULT CURRENT_DATE,
        data_vencimento DATE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem ver seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem ver seus próprios investimentos" ON public.investimentos FOR SELECT USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem criar seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem criar seus próprios investimentos" ON public.investimentos FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem atualizar seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem atualizar seus próprios investimentos" ON public.investimentos FOR UPDATE USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem deletar seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem deletar seus próprios investimentos" ON public.investimentos FOR DELETE USING (auth.uid() = user_id);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_investimentos_user_id ON public.investimentos(user_id);
  `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: schema });

        // Fallback if rpc exec_sql is not available (common in some Supabase setups without helper function),
        // we might need to rely on the fact that usually we can't run DDL via client unless specific privileges.
        // However, since I am 'System', I'll assume the client 'supabase' imported from '../database/db.js' has rights OR I check if I can use another way.
        // Actually, checking previous interactions, I didn't verify if `exec_sql` exists. 
        // If this fails, I'll have to ask user to look at console, but I can try to use raw SQL if library allows, but supabase-js client is data-only usually.
        // WAIT. Standard supbase client CANNOT run DDL (CREATE TABLE).
        // It must be run in the SQL Editor of Supabase Dashboard.
        // ERROR: I cannot create tables from nodejs client unless I have a specific stored procedure `exec_sql`.

        // checking if 'investimentos' route failed might be due to this.

        console.log('⚠️ Tentativa de criar tabela via RPC (pode falhar se a função exec_sql não existir)...');
        if (error) {
            console.error('❌ Erro RPC:', error);
            throw error;
        }
        console.log('✅ Tabela verificada/criada com sucesso!');

    } catch (error) {
        console.error('❌ Não foi possível criar a tabela automaticamente.');
        console.error('ℹ️ SQL Necessário:\n', schema);
    }
};

initInvestimentos();
