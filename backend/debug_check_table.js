import 'dotenv/config';
import supabase from './database/db.js';

async function checkSchema() {
    console.log('🔍 Inspecionando tabela CONTRATOS...');

    // Tentativa 1: Inserir e ver erro detalhado
    const { error } = await supabase.from('contratos').select('*').limit(1);

    if (error) {
        console.error('❌ Erro no SELECT:', error);
    } else {
        console.log('✅ SELECT funcionou. Tabela existe.');
    }

    // Tentativa 2: Listar colunas via RPC (se der) ou hack de insert inválido
    console.log('⚠️ Tentando Insert vazio para forçar erro de schema...');
    const { error: insertError } = await supabase.from('contratos').insert({});
    console.log('   Erro esperado:', insertError?.message);
}

checkSchema();
