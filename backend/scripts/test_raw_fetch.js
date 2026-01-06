const fetch = globalThis.fetch;

const url = "https://yizdwjphaynqrisftruo.supabase.co/rest/v1/produtos?select=*&limit=1";
const key = process.env.SUPABASE_ANON_KEY;

if (!key) {
    console.error("❌ Key não encontrada no process.env");
    process.exit(1);
}

console.log("Teste Raw Fetch para:", url);
console.log("Usando Key (parcial):", key.substring(0, 15) + "...");

try {
    const response = await fetch(url, {
        headers: {
            "apikey": key,
            "Authorization": `Bearer ${key}`
        }
    });

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    const text = await response.text();
    console.log("Response Body:", text);

    if (response.ok) {
        console.log("✅ SUCESSO! Credencial é válida.");
    } else {
        console.error("❌ FALHA! Credencial rejeitada.");
    }

} catch (err) {
    console.error("❌ Erro de rede:", err.message);
}
