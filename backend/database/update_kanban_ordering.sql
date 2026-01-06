-- UPDATE KANBAN ORDERING (V1.1)
-- Adiciona coluna de posição e função RPC para reordenação

BEGIN;

-- 1. Adicionar coluna 'posicao' se não existir
ALTER TABLE public.kanban_cards ADD COLUMN IF NOT EXISTS posicao INTEGER DEFAULT 0;

-- 2. Atualizar posições existentes (inicialmente ordem de criação)
WITH ordered_simple AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY coluna_id ORDER BY created_at) as rn
  FROM public.kanban_cards
)
UPDATE public.kanban_cards
SET posicao = ordered_simple.rn
FROM ordered_simple
WHERE public.kanban_cards.id = ordered_simple.id;


-- 3. Criar função RPC para incrementar posições (SHIFT)
-- Isso permite abrir espaço para um card ser inserido no meio de outros
CREATE OR REPLACE FUNCTION increment_card_position(p_coluna_id INTEGER, p_min_pos INTEGER, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.kanban_cards
  SET posicao = posicao + 1
  WHERE coluna_id = p_coluna_id
    AND posicao >= p_min_pos
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

SELECT 'Kanban ordering and RPC function updated successfully.' as status;
