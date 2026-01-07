import 'dotenv/config';
import supabase from './database/db.js';

async function listTransactions() {
    console.log('Fetching transactions...');
    const { data, error } = await supabase
        .from('transacoes')
        .select('*');

    if (error) {
        console.error('Error fetching transactions:', error);
    } else {
        console.log('Transactions found:', data.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

listTransactions();
