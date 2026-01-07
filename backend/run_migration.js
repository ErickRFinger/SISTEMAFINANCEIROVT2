import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Configurar cliente Supabase direto (para garantir permissões de admin/service)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Precisa ser a Service Key para DDL

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase ausentes (.env)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const migrationFile = path.join(__dirname, 'database', 'migration_contratos.sql');

    console.log(`📂 Lendo arquivo de migração: ${migrationFile}`);
    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('⚡ Executando SQL no Supabase...');

        // Supabase-js client standard doesn't execute raw SQL easily without RPC.
        // But we can try using the 'postgres' generic query if enabled, OR mostly used pattern:
        // Since we don't have direct SQL access via JS client without RPC 'exec_sql', 
        // We will assume the user has a setup RPC or we use a "hack" via Psql if installed.
        // WAIT: The user environment is Windows. 'psql' might not be in path.
        // Strategy B: Use a trusted "rpc" if it exists, otherwise warn.
        // Actually, this codebase uses 'postgres' direct query? No, it uses supabase-js.
        // Let's try to run it via a specific RPC 'exec_sql' if it exists (common pattern).

        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Erro na RPC exec_sql (Se não existir, rode o SQL manualmente no Dashboard Supabase):');
            console.error(error);

            // Fallback: Tentar dividir e rodar via query normal? Não dá via Client.
            console.warn('⚠️ AVISO: Se a função `exec_sql` não existir no seu banco, copie o conteúdo de `migration_contratos.sql` e rode no "SQL Editor" do dashboard Supabase.');
        } else {
            console.log('✅ Migração executada com sucesso!');
        }

    } catch (err) {
        console.error('❌ Erro ao ler/executar arquivo:', err);
    }
}

runMigration();
