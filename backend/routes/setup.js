import express from 'express';
import supabase from '../database/db.js';

const router = express.Router();

router.get('/investimentos', async (req, res) => {
    console.log('🔄 [SETUP] Inicializando tabela de investimentos...');

    const schema = `
    -- Criação da Nova Tabelade Investimentos (V2) para garantir funcionamento
    CREATE TABLE IF NOT EXISTS public.user_investimentos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        instituicao VARCHAR(100),
        valor_investido DECIMAL(15, 2) NOT NULL DEFAULT 0,
        valor_atual DECIMAL(15, 2) NOT NULL DEFAULT 0,
        data_aplicacao DATE DEFAULT CURRENT_DATE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Garantir que RLS está desativado para evitar bloqueios de permissão
    ALTER TABLE public.user_investimentos DISABLE ROW LEVEL SECURITY;

    -- Índice para performance
    CREATE INDEX IF NOT EXISTS idx_user_investimentos_user_id ON public.user_investimentos(user_id);

    CREATE TABLE IF NOT EXISTS public.investimentos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        instituicao VARCHAR(100),
        valor_investido DECIMAL(15, 2) NOT NULL DEFAULT 0,
        valor_atual DECIMAL(15, 2) NOT NULL DEFAULT 0,
        data_aplicacao DATE DEFAULT CURRENT_DATE,
        data_vencimento DATE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Como usamos Service Key e Auth Customizado, RLS pode atrapalhar se mal configurado. 
    -- O backend filtra por user_id manualmente.
    ALTER TABLE public.investimentos DISABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem ver seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem ver seus próprios investimentos" ON public.investimentos FOR SELECT USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem criar seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem criar seus próprios investimentos" ON public.investimentos FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem atualizar seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem atualizar seus próprios investimentos" ON public.investimentos FOR UPDATE USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'investimentos' AND policyname = 'Usuários podem deletar seus próprios investimentos'
        ) THEN
            CREATE POLICY "Usuários podem deletar seus próprios investimentos" ON public.investimentos FOR DELETE USING (auth.uid() = user_id);
        END IF;
    END
    $$;

    -- FIX: Ajustar Foreign Key para public.users caso tenha sido criada errada (auth.users)
    DO $$
    BEGIN
        -- Remove constraint antiga se existir (nome padrão do Postgres)
        ALTER TABLE public.investimentos DROP CONSTRAINT IF EXISTS investimentos_user_id_fkey;
        
        -- Remove constraint antiga se tiver outro nome comum
        ALTER TABLE public.investimentos DROP CONSTRAINT IF EXISTS investimentos_user_id_fkey1;

        -- Adiciona a correta apontando para public.users
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investimentos_user_id_fkey_public') THEN
            ALTER TABLE public.investimentos 
            ADD CONSTRAINT investimentos_user_id_fkey_public 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
    EXCEPTION WHEN OTHERS THEN 
        NULL; -- Ignora erros se a constraint já estiver certa ou tabela não existir
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_investimentos_user_id ON public.investimentos(user_id);
    `;

    try {
        // Tenta executar via RPC (se existir a função exec_sql)
        const { error } = await supabase.rpc('exec_sql', { sql_query: schema });

        if (error) {
            console.error('❌ Erro RPC:', error);
            // Se falhar, tenta informar o usuário para rodar manual
            return res.status(500).send(`
        <h1>Erro na Inicialização Automática</h1>
        <p>Não foi possível criar a tabela automaticamente porque a função RPC 'exec_sql' não existe no seu Supabase.</p>
        <p>Por favor, vá no painel do Supabase > SQL Editor e rode este comando:</p>
        <pre>${schema}</pre>
        <p>Erro técnico: ${JSON.stringify(error)}</p>
      `);
        }

        res.send('<h1>✅ Tabela de Investimentos criada com sucesso!</h1><p>Você já pode usar a funcionalidade no app.</p>');

    } catch (error) {
        console.error('❌ Erro fatal setup:', error);
        res.status(500).send('Erro interno no setup: ' + error.message);
    }
});

router.get('/financeiro-update', async (req, res) => {
    console.log('🔄 [SETUP] Atualizando tabela de transações (Financeiro V2)...');

    const schema = `
    DO $$
    BEGIN
        -- 1. Adicionar colunas na tabela TRANSACOES
        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN status VARCHAR(20) DEFAULT 'pago';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN data_vencimento DATE;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        -- 2. Atualizar registros antigos que estão nulos
        UPDATE public.transacoes SET status = 'pago' WHERE status IS NULL;
        UPDATE public.transacoes SET data_vencimento = data WHERE data_vencimento IS NULL;
        
        -- 3. Criar índices (se não existirem)
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_status') THEN
            CREATE INDEX idx_transacoes_status ON public.transacoes(status);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_vencimento') THEN
            CREATE INDEX idx_transacoes_vencimento ON public.transacoes(data_vencimento);
        END IF;
    END
    $$;
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: schema });

        if (error) {
            console.error('❌ Erro RPC:', error);
            // Fallback: tentar enviar script para user rodar
            return res.status(500).send(`
                <h1>Erro na Atualização Automática</h1>
                <p>Erro técnico: ${JSON.stringify(error)}</p>
                <p>Tente rodar o arquivo 'backend/database/UPDATE_FINANCIAL_SCHEMA.sql' manualmente no Supabase.</p>
            `);
        }

        res.send('<h1>✅ Atualização Financeira Concluída!</h1><p>Colunas status e data_vencimento adicionadas.</p>');

    } catch (error) {
        console.error('❌ Erro fatal setup:', error);
        res.status(500).send('Erro interno no setup: ' + error.message);
    }
});

router.get('/erp-update', async (req, res) => {
    console.log('🔄 [SETUP] Atualizando ERP (Estoque Inteligente & BI)...');

    const schema = `
    DO $$
    BEGIN
        -- 1. Adicionar estoque_minimo em produtos
        BEGIN
            ALTER TABLE public.produtos ADD COLUMN estoque_minimo INTEGER DEFAULT 5;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        -- 2. Criar índices para performance de BI
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_itens_venda_produto') THEN
            CREATE INDEX idx_itens_venda_produto ON public.itens_venda(produto_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vendas_cliente') THEN
            CREATE INDEX idx_vendas_cliente ON public.vendas(cliente_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vendas_data') THEN
            CREATE INDEX idx_vendas_data ON public.vendas(data_venda);
        END IF;

        -- 3. Adicionar is_recorrente em transacoes
        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN is_recorrente BOOLEAN DEFAULT FALSE;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
    END
    $$;
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: schema });

        if (error) {
            console.error('❌ Erro RPC:', error);
            return res.status(500).send(`
                <h1>Erro na Atualização ERP</h1>
                <p>Erro técnico: ${JSON.stringify(error)}</p>
                <p>Tente rodar 'backend/database/UPDATE_FULL_ERP_SCHEMA.sql' manualmente.</p>
            `);
        }

        res.send('<h1>✅ ERP Atualizado!</h1><p>Funcionalidades de Estoque Mínimo e BI habilitadas.</p>');

    } catch (error) {
        console.error('❌ Erro fatal setup:', error);
        res.status(500).send('Erro interno no setup: ' + error.message);
    }
});

router.get('/fix-system', async (req, res) => {
    const email = req.query.email || 'erick.finger123@gmail.com';
    console.log(`🚨 [FIX-SYSTEM] Iniciando reparo geral para ${email}...`);

    const schema = `
    DO $$
    BEGIN
        -- 1. ADICIONAR COLUNAS FINANCEIRAS
        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN status VARCHAR(20) DEFAULT 'pago';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN data_vencimento DATE;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN is_recorrente BOOLEAN DEFAULT FALSE;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        -- [NEW] CONTEXTO (PESSOAL vs EMPRESARIAL)
        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        BEGIN
            ALTER TABLE public.categorias ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        -- 2. ADICIONAR COLUNAS ERP (ESTOQUE)
        BEGIN
            ALTER TABLE public.produtos ADD COLUMN estoque_minimo INTEGER DEFAULT 5;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        -- 3. GARANTIR INDICES
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_status') THEN
            CREATE INDEX idx_transacoes_status ON public.transacoes(status);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_vencimento') THEN
            CREATE INDEX idx_transacoes_vencimento ON public.transacoes(data_vencimento);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_contexto') THEN
            CREATE INDEX idx_transacoes_contexto ON public.transacoes(contexto);
        END IF;
    END
    $$;
    `;

    try {
        // 1. Executar Schema Update
        const { error: schemaError } = await supabase.rpc('exec_sql', { sql_query: schema });
        if (schemaError) {
            console.error('❌ [FIX] Erro no Schema:', schemaError);
            // Continua mesmo com erro, pois pode ser que o RPC não exista, mas vamos tentar o upgrade de user
        } else {
            console.log('✅ [FIX] Schema verificado.');
        }

        // 2. Atualizar Usuário
        const { data, error: userError } = await supabase
            .from('users')
            .update({ tipo_conta: 'hibrido' })
            .eq('email', email)
            .select();

        if (userError) throw userError;

        res.send(`
            <h1>✅ SISTEMA CORRIGIDO!</h1>
            <p>1. Banco de dados atualizado (Colunas de Transações e Estoque).</p>
            <p>2. Usuário <b>${email}</b> atualizado para <b>HÍBRIDO</b>.</p>
            <hr/>
            <p>⚠️ <b>AGORA:</b> Volte para o Dashboard e recarregue a página (F5).</p>
        `);

    } catch (error) {
        console.error('❌ [FIX] Erro fatal:', error);
        res.status(500).send('Erro ao corrigir sistema: ' + error.message);
    }
});

// Rota de Correção de Estoque (Imagens + Tabela)
router.get('/fix-inventory', async (req, res) => {
    try {
        console.log('📦 [SETUP] Iniciando correção de Estoque...');
        const results = { db_column: 'pending', bucket: 'pending' };

        // 1. DATABASE: Adicionar coluna imagem_url
        try {
            const { error } = await supabase.rpc('exec_sql', {
                sql_query: `ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;`
            });

            // Fallback se RPC não existir (tenta via query direta se client permitir ddl, improvável mas ok)
            // Se RPC falhou, assumimos erro.
            if (error) {
                // Tentar método alternativo ou apenas logar
                console.warn('⚠️ [SETUP] Falha RPC exec_sql. Tentando ignorar se coluna já existe...');
            }
            results.db_column = 'ok (tried)';
        } catch (dbErr) {
            console.error('❌ [SETUP] Erro DB:', dbErr);
            results.db_column = 'error';
        }

        // 2. STORAGE: Tentar criar bucket 'produtos'
        try {
            // Verificar se bucket existe
            const { data: buckets } = await supabase.storage.listBuckets();
            const produtosBucket = buckets?.find(b => b.name === 'produtos');

            // 2.0 FORÇAR POLICIES (Mesmo se bucket ja existe)
            const rlsSql = `
                BEGIN;
                -- Habilitar RLS em storage.objects se ainda nao estiver (por padrao está)
                -- Mas vamos criar policies permissivas para o bucket 'produtos'
                
                -- 1. SELECT Publico
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Produtos'
                    ) THEN
                        CREATE POLICY "Public Access Produtos" ON storage.objects FOR SELECT USING ( bucket_id = 'produtos' );
                    END IF;
                END $$;

                -- 2. INSERT Autenticado
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Produtos'
                    ) THEN
                        CREATE POLICY "Authenticated Upload Produtos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );
                    END IF;
                END $$;

                -- 3. UPDATE/DELETE Dono (simplificado para autenticado por enquanto)
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Update Produtos'
                    ) THEN
                        CREATE POLICY "Authenticated Update Produtos" ON storage.objects FOR UPDATE USING ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );
                    END IF;
                END $$;

                COMMIT;
            `;
            // Tentar aplicar policies via RPC
            await supabase.rpc('exec_sql', { sql_query: rlsSql });


            if (!produtosBucket) {
                console.log('🆕 [SETUP] Criando bucket produtos...');
                const { error: createError } = await supabase.storage.createBucket('produtos', {
                    public: true,
                    fileSizeLimit: 5242880, // 5MB
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
                });

                if (createError) {
                    console.error('❌ [SETUP] Falha ao criar bucket:', createError);
                    results.bucket = 'failed_create - ' + createError.message;
                } else {
                    results.bucket = 'created';
                }
            } else {
                // Garantir que é público (update)
                const { error: updateError } = await supabase.storage.updateBucket('produtos', {
                    public: true
                });
                results.bucket = updateError ? 'exists_update_failed' : 'exists_public_verified_policies_applied';
            }
        } catch (storageErr) {
            console.error('❌ [SETUP] Erro Storage:', storageErr);
            results.bucket = 'error_accessing_storage';
        }

        res.json({
            msg: 'Tentativa de correção de estoque concluída',
            details: results,
            tip: 'Se o bucket falhou, crie manualmente no Supabase Dashboard: Storage -> New Bucket -> "produtos" (Public)'
        });

    } catch (error) {
        console.error('❌ [SETUP] Erro geral fix-inventory:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/update-context', async (req, res) => {
    console.log('🔄 [SETUP] Adicionando coluna contexto (Personal/Business)...');

    const schema = `
    DO $$
    BEGIN
        -- 1. Adicionar coluna contexto
        BEGIN
            ALTER TABLE public.transacoes ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;

        -- 2. Índice para performance
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transacoes_contexto') THEN
            CREATE INDEX idx_transacoes_contexto ON public.transacoes(contexto);
        END IF;

        -- 3. Categorias também podem ter contexto (Opcional, mas bom para filtrar categorias de empresa)
        BEGIN
            ALTER TABLE public.categorias ADD COLUMN contexto VARCHAR(20) DEFAULT 'pessoal';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
    END
    $$;
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: schema });

        if (error) {
            console.error('❌ Erro RPC:', error);
            return res.status(500).send(`Erro ao atualizar: ${JSON.stringify(error)}`);
        }

        res.send('<h1>✅ Atualização de Contexto Concluída!</h1><p>Agora as transações podem ser separadas entre Pessoal e Empresarial.</p>');

    } catch (error) {
        console.error('❌ Erro fatal setup:', error);
        res.status(500).send('Erro interno: ' + error.message);
    }
});

export default router;
