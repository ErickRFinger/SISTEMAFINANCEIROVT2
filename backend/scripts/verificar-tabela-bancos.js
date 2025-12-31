import dotenv from 'dotenv';
import supabase from '../database/db.js';

dotenv.config();

async function verificarTabelaBancos() {
  console.log('🔍 Verificando tabela bancos...\n');
  
  try {
    // Tentar fazer uma query simples
    const { data, error } = await supabase
      .from('bancos')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela bancos:');
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      console.error('   Detalhes:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.code === '42P01') {
        console.error('\n⚠️ A tabela bancos NÃO EXISTE no banco de dados!');
        console.error('   Execute o script SQL: backend/database/schema-novas-tabelas.sql no Supabase SQL Editor');
      } else if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.error('\n⚠️ Erro de permissão (RLS)!');
        console.error('   A tabela bancos existe, mas as políticas de RLS estão bloqueando o acesso.');
        console.error('   No Supabase, vá em Authentication > Policies e configure as políticas para a tabela bancos.');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Tabela bancos existe e está acessível!');
    console.log(`   Total de registros: ${data?.length || 0}`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

verificarTabelaBancos();

