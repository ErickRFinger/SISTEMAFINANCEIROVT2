import supabase from './database/db.js';

async function checkColumn() {
    console.log('Checking transacoes table schema...');

    // Try to select the column from one row
    const { data, error } = await supabase
        .from('transacoes')
        .select('id, contexto')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting contexto:', error);
        if (error.code === 'PGRST204' || error.message.includes('column') || error.message.includes('does not exist')) {
            console.log('💡 DIAGNOSIS: The "contexto" column does NOT exist.');
        }
    } else {
        console.log('✅ Success! "contexto" column exists.');
        console.log('Sample data:', data);
    }
}

checkColumn();
