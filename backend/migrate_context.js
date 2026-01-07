import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service Key usually needed for DDL, but client might work if own RPC exists

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const schema = `
DO $$
BEGIN
    -- 1. Adicionar coluna contexto
    BEGIN
        ALTER TABLE public.transacoes ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    -- 2. Índice
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_contexto') THEN
        CREATE INDEX idx_transacoes_contexto ON public.transacoes(contexto);
    END IF;
    
    -- 3. Categorias
    BEGIN
        ALTER TABLE public.categorias ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END
$$;
`;

async function runMigration() {
    console.log("Running migration...");
    const { error } = await supabase.rpc('exec_sql', { sql_query: schema });
    if (error) {
        console.error("Migration failed:", error);
    } else {
        console.log("Migration successful!");
    }
}

runMigration();
