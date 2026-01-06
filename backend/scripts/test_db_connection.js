import supabase from '../database/db.js';

async function testConnection() {
    console.log('--- TESTE DE CONEXÃO E TABELAS ---');

    // 1. Test Auth/Connection (Simple Select)
    try {
        console.log('1. Testando conexão básica com public.produtos...');
        const { data, error } = await supabase
            .from('produtos')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ ERRO AO CONECTAR:', error.message);
            console.error('   Detalhes:', error);
            if (error.message.includes('Supabase não configurado')) {
                console.error('   FATAL: As variáveis de ambiente não foram carregadas ou estão vazias.');
            }
        } else {
            console.log('✅ Conexão OK. Acesso à tabela produtos realizado.');
        }
    } catch (err) {
        console.error('❌ EXCEPTION Conexão:', err.message);
    }

    // 2. Test RLS (Tentativa de Insert sem Auth - Deve falhar se RLS estiver ON e mal configurado, ou Sucesso se estiver OFF)
    try {
        console.log('\n2. Testando INSERT de teste (verificando RLS/Permissões)...');
        // Usar um UUID aleatório ou um conhecido para teste
        const testUUID = '00000000-0000-0000-0000-000000000000';

        const { data, error } = await supabase
            .from('produtos')
            .insert([{
                user_id: testUUID,
                nome: 'PRODUTO TESTE DEBUG',
                descricao: 'Criado pelo script de debug',
                preco_venda: 10,
                tipo_item: 'produto'
            }])
            .select();

        if (error) {
            console.error('❌ ERRO NO INSERT:', error.message);
            console.error('   Hint:', error.hint);
            console.error('   Code:', error.code);

            if (error.code === '42501') {
                console.error('   => RLS BLOCK: O banco bloqueou a escrita. RLS pode estar ATIVO e sem policy para service_role/anon.');
            }
        } else {
            console.log('✅ INSERT SUCESSO! O banco aceitou a escrita.');
            console.log('   (Isso indica que as tabelas estão OK e aceitam UUIDs).');

            // Cleanup
            await supabase.from('produtos').delete().eq('id', data[0].id);
            console.log('   (Registro de teste removido)');
        }
    } catch (err) {
        console.error('❌ EXCEPTION Insert:', err.message);
    }

    console.log('\n--- FIM DO TESTE ---');
}

testConnection();
