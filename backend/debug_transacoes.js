import 'dotenv/config';
import supabase from './database/db.js';

async function debugTransacoes() {
    console.log('🔍 Iniciando diagnóstico de transações...');

    // 1. Check user ID (assuming single user or listing all for now)
    // We can't easily guess the user ID without auth context, so we'll list all distinct users
    const { data: users, error: userError } = await supabase.from('transacoes').select('user_id').limit(1);

    if (userError) {
        console.error('❌ Erro ao acessar tabela transacoes:', userError.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log('⚠️ Nenhuma transação encontrada no banco.');
        return;
    }

    const userId = users[0].user_id; // Pick one user for testing
    console.log(`📌 Verificando para User ID (exemplo): ${userId}`);


    // 2. Count by Context
    const { data: allTransacoes, error: listError } = await supabase
        .from('transacoes')
        .select('id, descricao, valor, tipo, contexto, data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (listError) {
        console.error('❌ Erro ao listar:', listError.message);
        return;
    }

    console.log(`\n📊 Total de Transações encontradas: ${allTransacoes.length}`);

    const byContext = {};
    let totalValorPessoal = 0;

    allTransacoes.forEach(t => {
        const ctx = t.contexto || 'UNDEFINED';
        if (!byContext[ctx]) byContext[ctx] = 0;
        byContext[ctx]++;

        if (ctx === 'pessoal' || ctx === 'UNDEFINED') { // Assuming undefined might be treated as personal default logic?
            console.log(`   - [${t.data}] ${t.descricao}: R$ ${t.valor} (${t.tipo}) [Contexto: ${t.contexto}]`);
            if (t.tipo === 'receita') totalValorPessoal += parseFloat(t.valor);
            else totalValorPessoal -= parseFloat(t.valor);
        }
    });

    console.log('\n📈 Distribuição por Contexto:');
    console.table(byContext);

    console.log(`\n💰 Saldo Calculado (Pessoal): R$ ${totalValorPessoal.toFixed(2)}`);
}

debugTransacoes();
