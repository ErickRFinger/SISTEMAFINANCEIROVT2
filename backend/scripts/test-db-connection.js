import supabase from '../database/db.js';

async function testConnection() {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    // Do not log the full key for security, just check if it exists
    console.log('Key exists:', !!process.env.SUPABASE_ANON_KEY || !!process.env.SUPABASE_SERVICE_KEY);

    if (!supabase) {
        console.error('❌ Supabase client is null. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env');
        return;
    }

    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);

        if (error) {
            console.error('❌ Connection failed:', error);
        } else {
            console.log('✅ Connection successful!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testConnection();
