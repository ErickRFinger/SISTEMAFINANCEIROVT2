# 💰 Sistema Financeiro

Sistema completo de controle financeiro pessoal desenvolvido com Node.js, Express, React e Supabase.

## 🚀 Funcionalidades

- ✅ Autenticação de usuários (registro e login)
- ✅ Dashboard com resumo financeiro
- ✅ Gestão de transações (receitas e despesas)
- ✅ Gestão de categorias personalizadas
- ✅ Metas financeiras
- ✅ Bancos e cartões de crédito
- ✅ Gastos recorrentes
- ✅ Perfil do usuário
- ✅ Interface moderna e responsiva (mobile-friendly)
- ✅ Tema escuro
- ✅ Banco de dados Supabase (PostgreSQL)

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase (gratuita)

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/sistema-financeiro.git
cd sistema-financeiro
```

### 2. Instale as dependências

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configure o Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Execute os scripts SQL na ordem:
   - `backend/database/schema.sql` (tabelas principais)
   - `backend/database/schema-novas-tabelas.sql` (tabelas de metas, bancos, etc)

### 4. Configure as variáveis de ambiente

#### Backend

Crie um arquivo `.env` na pasta `backend/`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
JWT_SECRET=uma_string_secreta_aleatoria_aqui
PORT=3001
```

**Como gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Inicie o sistema

#### Opção 1: Script automático (Recomendado)

```bash
./start.sh
```

#### Opção 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📤 Deploy no Vercel

O projeto está configurado para deploy no Vercel. Consulte `VERCEL_DEPLOY.md` para instruções detalhadas.

### Deploy rápido:

1. Configure as variáveis de ambiente no Vercel
2. Execute: `vercel --prod`
3. Ou conecte ao GitHub para deploy automático

## 📁 Estrutura do Projeto

```
SISTEMA FINANCEIRO/
├── api/
│   └── index.js              # Entry point para Vercel
├── backend/
│   ├── database/             # Scripts SQL e configuração
│   ├── middleware/           # Auth, upload
│   ├── routes/               # Rotas da API
│   ├── services/             # Serviços (OCR)
│   ├── scripts/              # Scripts auxiliares
│   └── server.js             # Servidor Express
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── context/          # Context API
│   │   ├── pages/            # Páginas
│   │   └── services/         # API client
│   └── public/               # Arquivos estáticos
├── scripts/                  # Scripts de utilidade
├── vercel.json               # Configuração Vercel
└── README.md                 # Este arquivo
```

## 🔐 Segurança

- Senhas são hasheadas com bcrypt
- Autenticação via JWT
- Row Level Security (RLS) no Supabase
- Validação de dados no backend

## 📚 Documentação Adicional

- `VERCEL_DEPLOY.md` - Guia de deploy no Vercel
- `SUPABASE_SETUP.md` - Configuração do Supabase
- `INICIO_RAPIDO.md` - Guia rápido de uso

## 🐛 Troubleshooting

### Erro: "Cannot find module"
Execute `npm install` nas pastas `backend/` e `frontend/`

### Erro: "Table does not exist"
Execute os scripts SQL no Supabase na ordem correta

### Erro: "RLS policy violation"
Desabilite temporariamente o RLS ou configure as políticas no Supabase

## 📝 Licença

ISC

## 👨‍💻 Desenvolvido com

- **Backend**: Node.js, Express, Supabase
- **Frontend**: React, Vite, Axios
- **Banco de Dados**: PostgreSQL (Supabase)
- **Deploy**: Vercel

---

**Desenvolvido com ❤️ para controle financeiro pessoal**
