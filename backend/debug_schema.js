import 'dotenv/config';
import supabase from './database/db.js';

async function inspectSchema() {
    console.log('🔍 INSPECTING DATABASE SCHEMA...');

    try {
        console.log('\n--- TABLE: transacoes ---');
        // Fetch 1 row to see keys, or try to insert dummy to see constraints if necessary
        const { data: tData, error: tError } = await supabase.from('transacoes').select('*').limit(1);

        if (tError) {
            console.error('❌ Error accessing transacoes:', tError.message);
        } else {
            if (tData.length > 0) {
                console.log('✅ Columns found:', Object.keys(tData[0]).join(', '));
                console.log('Sample Row:', tData[0]);
            } else {
                console.log('⚠️ Table is empty. Cannot infer columns from data.');
                // Try to get definition via metadata if possible (not easy via JS client), 
                // but usually there's at least one row or we can try a basic insert.
            }
        }

        console.log('\n--- TABLE: kanban_cards ---');
        const { data: kData, error: kError } = await supabase.from('kanban_cards').select('*').limit(1);

        if (kError) {
            console.error('❌ Error accessing kanban_cards:', kError.message);
        } else {
            if (kData.length > 0) {
                console.log('✅ Columns found:', Object.keys(kData[0]).join(', '));
                console.log('Sample Row:', kData[0]);
            } else {
                console.log('⚠️ Table is empty.');
            }
        }

        console.log('\n--- TABLE: kanban_colunas ---');
        const { data: cData, error: cError } = await supabase.from('kanban_colunas').select('*').limit(5);
        if (cError) {
            console.error('❌ Error accessing kanban_colunas:', cError.message);
        } else {
            console.log('Found Columns:', cData.length);
            cData.forEach(c => console.log(`[${c.id}] ${c.titulo} (Order: ${c.ordem})`));
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

inspectSchema();
