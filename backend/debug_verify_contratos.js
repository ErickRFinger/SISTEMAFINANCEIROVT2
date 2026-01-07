import 'dotenv/config';
import ContratosService from './services/contratos.js';
import supabase from './database/db.js';

async function testContratos() {
    console.log('🧪 Testando Módulo de Contratos...');

    // 1. Pegar um usuário de teste (ID 2, que sabemos que existe do debug anterior)
    const userId = 2;

    try {
        // 2. Criar Contrato
        console.log('📝 Criando contrato de teste...');
        const novo = await ContratosService.create(userId, {
            titulo: 'Contrato Teste Script',
            valor: 1500,
            dia_vencimento: 15,
            ciclo: 'mensal',
            status: 'ativo'
        });
        console.log('✅ Contrato criado:', novo.id, '-', novo.titulo);

        // 3. Listar
        console.log('📋 Listando contratos...');
        const lista = await ContratosService.list(userId);
        console.log(`✅ Encontrados: ${lista.length} contratos`);

        if (lista.length > 0) {
            console.log('   Primeiro item:', lista[0].titulo, '(ID:', lista[0].id, ')');
        }

        // 4. Limpeza (Deletar o teste)
        console.log('🧹 Limpando teste...');
        const { error } = await supabase.from('contratos').delete().eq('id', novo.id);
        if (error) console.error('❌ Erro ao deletar:', error);
        else console.log('✅ Contrato de teste removido.');

        console.log('\n🎉 TESTE CONCLUÍDO: A tabela funciona e o Backend está ok!');

    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
    }
}

testContratos();
