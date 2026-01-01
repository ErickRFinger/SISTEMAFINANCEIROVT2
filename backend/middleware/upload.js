import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de uploads - IGNORADO EM MEMORY STORAGE
// Mantido apenas para evitar erros de referência se algo antigo chamar, mas sem efeitos colaterais.
const uploadDir = (process.env.VERCEL || process.env.NODE_ENV === 'production')
  ? os.tmpdir()
  : path.join(__dirname, '../uploads');

// REMOVIDO: fs.mkdirSync que causa crash no Vercel (Read-only OS)
// if (uploadDir !== os.tmpdir() && ... ) { ... }

// Configuração do multer memoryStorage (Ideal para Vercel/Serverless)
const storage = multer.memoryStorage();

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// Função para limpar arquivo (No-op para memória, mas mantido para compatibilidade)
export const deleteFile = (filePath) => {
  // Em memória não precisa deletar arquivo físico
  try {
    if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // ignorar
  }
};



