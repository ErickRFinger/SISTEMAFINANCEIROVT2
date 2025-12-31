import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Debug crítico para Vercel
console.log('🔌 [DB] Inicializando cliente Supabase...');
console.log('   ENV:', process.env.NODE_ENV);
console.log('   URL:', process.env.SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA');
console.log('   KEY:', process.env.SUPABASE_ANON_KEY ? 'Definida' : 'NÃO DEFINIDA');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [DB] ERRO CRÍTICO: Variáveis de conexão faltando!');
  // Não lançar erro no top-level para não quebrar o build, mas o cliente ficará inutilizável
}

// Configurações otimizadas para Serverless (Vercel)
const options = {
  auth: {
    persistSession: false, // Serverless não tem persistência de sessão local
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  // Reduzir timeouts em ambiente serverless
  global: {
    headers: { 'x-application-name': 'sistema-financeiro' }
  }
};

let supabase;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, options);
    console.log('✅ [DB] Cliente Supabase criado com sucesso');
  } else {
    console.warn('⚠️ [DB] Cliente Supabase NÃO inicializado (falta configuração)');
    // Criar um mock para não quebrar imports, mas que falhará ao usar
    supabase = {
      from: () => ({ select: () => Promise.reject(new Error('Supabase não configurado')) })
    };
  }
} catch (error) {
  console.error('❌ [DB] Erro ao criar cliente:', error);
  throw error;
}

export default supabase;
