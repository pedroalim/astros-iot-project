import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes'; // Importa nossas rotas

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Prefixo '/api' para todas as rotas
// Isso significa que suas rotas serão acessadas em /api/astro, /api/usuario, etc.
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`✨ Servidor AstroView rodando em http://localhost:${PORT}`);
});