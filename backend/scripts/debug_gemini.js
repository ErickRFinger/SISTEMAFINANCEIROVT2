
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada no .env');
        process.exit(1);
    }

    console.log('🔑 Consultando API para listar modelos disponíveis...');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Detalhes:', text);
            return;
        }

        const data = await response.json();

        if (data.models) {
            console.log('✅ Modelos Disponíveis:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.log('⚠️ Nenhum modelo retornado:', data);
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

listModels();
