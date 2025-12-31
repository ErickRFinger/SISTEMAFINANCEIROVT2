import supabase from '../database/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function testarResumo() {
  try {
    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'erick.finger123@gmail.com')
      .single();
    
    if (userError || !user) {
      console.log('❌ Usuário não encontrado:', userError);
      return;
    }
    
    console.log('✅ Usuário encontrado:', user.email, 'ID:', user.id);
    
    // Buscar todas as transações do usuário
    const { data: todasTransacoes, error: todasError } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });
    
    if (todasError) {
      console.error('❌ Erro ao buscar transações:', todasError);
      return;
    }
    
    console.log('\n📊 Todas as transações:', todasTransacoes.length);
    todasTransacoes.forEach(t => {
      console.log(`  - ${t.data} | ${t.tipo} | R$ ${t.valor} | ${t.descricao}`);
    });
    
    // Calcular resumo do mês atual
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = String(hoje.getFullYear());
    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);
    const startDate = `${anoNum}-${mes}-01`;
    const lastDay = new Date(anoNum, mesNum, 0).getDate();
    const endDate = `${anoNum}-${mes}-${String(lastDay).padStart(2, '0')}`;
    
    console.log('\n📅 Filtro do mês atual:');
    console.log('  Mês/Ano:', mes, ano);
    console.log('  Data início:', startDate);
    console.log('  Data fim:', endDate);
    
    const { data: transacoesMes, error: mesError } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', startDate)
      .lte('data', endDate);
    
    if (mesError) {
      console.error('❌ Erro ao buscar transações do mês:', mesError);
      return;
    }
    
    console.log('\n📊 Transações do mês atual:', transacoesMes.length);
    transacoesMes.forEach(t => {
      console.log(`  - ${t.data} | ${t.tipo} | R$ ${t.valor} | ${t.descricao}`);
    });
    
    // Calcular totais
    const receitas = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + parseFloat(t.valor || 0), 0);
    
    const despesas = transacoesMes
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + parseFloat(t.valor || 0), 0);
    
    const saldo = receitas - despesas;
    
    console.log('\n💰 Resumo do Mês:');
    console.log('  Receitas: R$', receitas.toFixed(2));
    console.log('  Despesas: R$', despesas.toFixed(2));
    console.log('  Saldo: R$', saldo.toFixed(2));
    
    // Verificar se há a despesa de 100
    const despesa100 = transacoesMes.find(t => 
      parseFloat(t.valor) === 100 && t.tipo === 'despesa'
    );
    
    if (despesa100) {
      console.log('\n✅ Despesa de R$ 100 encontrada!');
      console.log('  Data:', despesa100.data);
      console.log('  Descrição:', despesa100.descricao);
      console.log('  Está dentro do filtro:', 
        despesa100.data >= startDate && despesa100.data <= endDate
      );
    } else {
      console.log('\n⚠️  Despesa de R$ 100 NÃO encontrada no mês atual');
      const despesa100Geral = todasTransacoes.find(t => 
        parseFloat(t.valor) === 100 && t.tipo === 'despesa'
      );
      if (despesa100Geral) {
        console.log('  Mas foi encontrada com data:', despesa100Geral.data);
        console.log('  Está dentro do filtro?', 
          despesa100Geral.data >= startDate && despesa100Geral.data <= endDate
        );
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testarResumo();

