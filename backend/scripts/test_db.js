
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://psrzhonlxeoastsbcwhv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UsDPIXyysyDgaNXorqNEWQ_rAl5ao_A'; // Anon Key

console.log('🔌 Testando conexão com Supabase...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_KEY.substring(0, 10) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Falha na conexão:', error.message);
            console.error('Detalhes:', error);
        } else {
            console.log('✅ Conexão BEM SUCEDIDA!');
            console.log('Tabela users acessível.');
        }
    } catch (err) {
        console.error('❌ Erro Crítico:', err);
    }
}

testConnection();
