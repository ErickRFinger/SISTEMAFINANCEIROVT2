# 🚀 Início Rápido

## Instalação e Execução

### Opção 1: Script Automático (Recomendado)

Execute o script de inicialização:

```bash
./start.sh
```

Este script irá:
- Instalar todas as dependências automaticamente
- Iniciar o backend na porta 3001
- Iniciar o frontend na porta 3000

### Opção 2: Manual

#### 1. Backend

```bash
cd backend
npm install
npm start
```

#### 2. Frontend (em outro terminal)

```bash
cd frontend
npm install
npm run dev
```

## Acessar o Sistema

1. Abra seu navegador em: `http://localhost:3000`
2. Crie uma conta ou faça login
3. Comece a usar o sistema!

## Primeiros Passos

1. **Criar uma conta**: Clique em "Cadastre-se" e preencha seus dados
2. **Adicionar categorias**: Vá em "Categorias" e crie suas categorias personalizadas (ou use as padrão)
3. **Registrar transações**: Vá em "Transações" e adicione suas receitas e despesas
4. **Visualizar resumo**: No Dashboard você verá um resumo das suas finanças

## Dicas

- Use o filtro de mês/ano para visualizar períodos específicos
- Organize suas transações por categorias para melhor controle
- O saldo é calculado automaticamente (Receitas - Despesas)

## Problemas?

- Certifique-se de que o Node.js está instalado (versão 18+)
- Verifique se as portas 3000 e 3001 estão livres
- Veja os logs no terminal para identificar erros

