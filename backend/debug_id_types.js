import 'dotenv/config';
import supabase from './database/db.js';

async function checkTypes() {
    console.log('🔍 Verificando tipos de dados (ID)...');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND column_name = 'id' 
            AND table_name IN ('users', 'clientes');
        `
    });

    // Fallback if RPC fails (likely will as identified before)
    if (error) {
        console.log('⚠️ RPC falhou. Tentando inferir por SELECT...');

        const { data: users } = await supabase.from('users').select('id').limit(1);
        const { data: clientes } = await supabase.from('clientes').select('id').limit(1);

        console.log('Users ID Type sample:', typeof users?.[0]?.id, 'Value:', users?.[0]?.id);
        console.log('Clientes ID Type sample:', typeof clientes?.[0]?.id, 'Value:', clientes?.[0]?.id);

        return;
    }

    console.table(data);
}

checkTypes();
