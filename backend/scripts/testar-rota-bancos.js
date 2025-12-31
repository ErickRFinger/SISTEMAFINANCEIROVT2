import express from 'express';
import bancosRoutes from '../routes/bancos.js';

const app = express();
app.use(express.json());

// Simular o registro da rota
app.use('/api/bancos', bancosRoutes);

// Listar todas as rotas registradas
console.log('\n📋 Rotas registradas no Express:');
app._router.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(`   ${i}. ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
  } else if (layer.regexp) {
    const regexStr = layer.regexp.toString();
    if (regexStr.includes('bancos')) {
      console.log(`   ${i}. Middleware/Router: ${regexStr.substring(0, 80)}`);
    }
  }
});

console.log('\n✅ Teste concluído. Se a rota /api/bancos aparecer acima, está registrada corretamente.');

