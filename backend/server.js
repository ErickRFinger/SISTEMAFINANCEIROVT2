import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ROOT is working' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ultrafast Safe Mode Backend is RUNNING',
    timestamp: new Date().toISOString()
  });
});

// Handler for Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
