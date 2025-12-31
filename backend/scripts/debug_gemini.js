
// Script sem dependencias (sem dotenv)
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY não definida via variável de ambiente');
    process.exit(1);
}

console.log('🔑 Consultando API (Sem dependências)...');

async function listModels() {
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
            console.log('✅ SUCESSO! Chave válida.');
            console.log('Modelos acessíveis:');
            data.models.forEach(m => {
                if (m.name.includes('flash')) { // Filtrar apenas os flash para não poluir
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log('⚠️ Resposta estranha:', data);
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

listModels();
