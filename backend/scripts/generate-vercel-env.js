import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler o arquivo .env
const envPath = path.join(__dirname, '../.env');

try {
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Extrair variáveis
    const vars = {};
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            const cleanKey = key.trim();
            const cleanValue = value.join('=').trim().replace(/"/g, '').replace(/'/g, '');
            if (['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'].includes(cleanKey)) {
                vars[cleanKey] = cleanValue;
            }
        }
    });

    console.log('\n✅ COPIE E COLE ESSAS VARIÁVEIS EXATAMENTE COMO ESTÃO NO VERCEL:');
    console.log('---------------------------------------------------------------');
    console.log('SUPABASE_URL=' + (vars.SUPABASE_URL || 'FALTANDO'));
    console.log('SUPABASE_ANON_KEY=' + (vars.SUPABASE_ANON_KEY || 'FALTANDO'));
    console.log('JWT_SECRET=' + (vars.JWT_SECRET || 'FALTANDO'));
    console.log('---------------------------------------------------------------');
    console.log('\n⚠️ Se alguma estiver FALTANDO, verifique seu arquivo .env local.');

} catch (error) {
    console.error('❌ Erro ao ler arquivo .env:', error.message);
}
