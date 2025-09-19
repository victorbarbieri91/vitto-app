-- supabase/migrations/20250621153000_create_transfer_function.sql

CREATE OR REPLACE FUNCTION create_transfer(
  p_from_account_id INT,
  p_to_account_id INT,
  p_amount NUMERIC,
  p_date DATE,
  p_description TEXT,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  transfer_category_id INT;
BEGIN
  -- Encontrar ou criar a categoria 'Transferência'
  SELECT id INTO transfer_category_id
  FROM app_categoria
  WHERE nome = 'Transferência' AND user_id = p_user_id AND tipo = 'transferencia';

  IF transfer_category_id IS NULL THEN
    INSERT INTO app_categoria (nome, tipo, user_id)
    VALUES ('Transferência', 'transferencia', p_user_id)
    RETURNING id INTO transfer_category_id;
  END IF;

  -- Lançamento de saída da conta de origem
  INSERT INTO app_lancamento (conta_id, categoria_id, tipo, valor, data, descricao, user_id)
  VALUES (p_from_account_id, transfer_category_id, 'despesa', p_amount, p_date, p_description, p_user_id);

  -- Lançamento de entrada na conta de destino
  INSERT INTO app_lancamento (conta_id, categoria_id, tipo, valor, data, descricao, user_id)
  VALUES (p_to_account_id, transfer_category_id, 'receita', p_amount, p_date, p_description, p_user_id);

  -- Atualizar saldo da conta de origem (diminuir)
  UPDATE app_conta
  SET saldo_atual = saldo_atual - p_amount
  WHERE id = p_from_account_id;

  -- Atualizar saldo da conta de destino (aumentar)
  UPDATE app_conta
  SET saldo_atual = saldo_atual + p_amount
  WHERE id = p_to_account_id;

END;
$$ LANGUAGE plpgsql;
