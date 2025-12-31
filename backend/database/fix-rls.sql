-- Script para corrigir RLS no Supabase
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS nas tabelas (recomendado para este sistema)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;

-- OU criar políticas que permitam todas as operações (alternativa)
-- Se preferir manter RLS habilitado, descomente as políticas abaixo:

/*
-- Políticas para users
CREATE POLICY "Users podem ver seus próprios dados"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users podem inserir seus próprios dados"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users podem atualizar seus próprios dados"
ON users FOR UPDATE
USING (true);

-- Políticas para categorias
CREATE POLICY "Users podem ver suas próprias categorias"
ON categorias FOR SELECT
USING (true);

CREATE POLICY "Users podem inserir suas próprias categorias"
ON categorias FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users podem atualizar suas próprias categorias"
ON categorias FOR UPDATE
USING (true);

CREATE POLICY "Users podem deletar suas próprias categorias"
ON categorias FOR DELETE
USING (true);

-- Políticas para transacoes
CREATE POLICY "Users podem ver suas próprias transações"
ON transacoes FOR SELECT
USING (true);

CREATE POLICY "Users podem inserir suas próprias transações"
ON transacoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users podem atualizar suas próprias transações"
ON transacoes FOR UPDATE
USING (true);

CREATE POLICY "Users podem deletar suas próprias transações"
ON transacoes FOR DELETE
USING (true);
*/

