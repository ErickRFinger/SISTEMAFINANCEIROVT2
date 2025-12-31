import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import supabase from '../database/db.js';

dotenv.config();

async function criarUsuarioTeste() {
  try {
    const nome = 'Usuário Teste';
    const email = 'teste@teste.com';
    const senha = 'teste123';

    console.log('🔐 Criando usuário de teste...');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${senha}`);

    // Verificar se usuário já existe
    const { data: usuarioExistente, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (usuarioExistente) {
      console.log('⚠️  Usuário já existe!');
      console.log(`ID: ${usuarioExistente.id}`);
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{ nome, email, senha: senhaHash }])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log(`ID: ${newUser.id}`);

    // Criar categorias padrão
    const categoriasPadrao = [
      { user_id: newUser.id, nome: 'Salário', tipo: 'receita', cor: '#10b981' },
      { user_id: newUser.id, nome: 'Freelance', tipo: 'receita', cor: '#3b82f6' },
      { user_id: newUser.id, nome: 'Alimentação', tipo: 'despesa', cor: '#ef4444' },
      { user_id: newUser.id, nome: 'Transporte', tipo: 'despesa', cor: '#f59e0b' },
      { user_id: newUser.id, nome: 'Moradia', tipo: 'despesa', cor: '#8b5cf6' },
      { user_id: newUser.id, nome: 'Saúde', tipo: 'despesa', cor: '#ec4899' }
    ];

    const { error: catError } = await supabase.from('categorias').insert(categoriasPadrao);

    if (catError) {
      console.error('⚠️  Erro ao criar categorias:', catError);
    } else {
      console.log('✅ Categorias padrão criadas!');
    }

    console.log('\n📋 Credenciais de acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${senha}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

criarUsuarioTeste();

