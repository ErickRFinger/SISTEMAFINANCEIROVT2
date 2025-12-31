-- Tabela de Investimentos
CREATE TABLE IF NOT EXISTS public.investimentos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL, -- Ex: CDB Nubank, Fundos Imobiliários
    tipo VARCHAR(50) NOT NULL, -- Ex: renda_fixa, acoes, fiis, cripto, tesouro, outros
    instituicao VARCHAR(100), -- Ex: Nubank, XP, Rico, Binance
    valor_investido DECIMAL(15, 2) NOT NULL DEFAULT 0,
    valor_atual DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Para calcular rendimento
    data_aplicacao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE, -- Opcional
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de Segurança (RLS)
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios investimentos" 
ON public.investimentos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios investimentos" 
ON public.investimentos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios investimentos" 
ON public.investimentos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios investimentos" 
ON public.investimentos FOR DELETE 
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_investimentos_user_id ON public.investimentos(user_id);
