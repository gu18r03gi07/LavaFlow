SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT
  (SELECT count(*) FROM usuarios) AS usuarios,
  (SELECT count(*) FROM veiculos) AS veiculos,
  (SELECT count(*) FROM servicos) AS servicos,
  (SELECT count(*) FROM boxes) AS boxes;

SELECT tgname AS gatilho, tgrelid::regclass AS tabela
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgname;

SELECT proname AS nome, prokind AS tipo
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

WITH novo AS (
  INSERT INTO agendamentos (usuario_id, veiculo_id, servico_id, box_id, inicio, fim)
  SELECT
    (SELECT id FROM usuarios WHERE email = 'marina@email.com'),
    (SELECT id FROM veiculos WHERE placa = 'ABC-1D23'),
    (SELECT id FROM servicos WHERE nome = 'Lavagem Completa'),
    (SELECT id FROM boxes WHERE nome = 'Box 01'),
    '2030-01-15 10:00',
    '2030-01-15 10:01'
  RETURNING id, inicio, fim
)
SELECT * FROM novo;

UPDATE agendamentos
SET status = 'RECEBIDO'
WHERE inicio = '2030-01-15 10:00';

UPDATE agendamentos
SET status = 'EM_LAVAGEM'
WHERE inicio = '2030-01-15 10:00';

SELECT agendamento_id, status_anterior, status_novo, alterado_em
FROM historico_status_agendamento
ORDER BY id DESC
LIMIT 5;

SELECT * FROM vw_agendamentos_detalhados
WHERE inicio >= '2030-01-01';

SELECT * FROM vw_resumo_agendamentos
WHERE data >= '2030-01-01';

INSERT INTO agendamentos (usuario_id, veiculo_id, servico_id, box_id, inicio, fim)
SELECT
  (SELECT id FROM usuarios WHERE email = 'marina@email.com'),
  (SELECT id FROM veiculos WHERE placa = 'EKO-7F89'),
  (SELECT id FROM servicos WHERE nome = 'Lavagem Essencial'),
  (SELECT id FROM boxes WHERE nome = 'Box 01'),
  '2030-01-15 10:30',
  '2030-01-15 11:30';

DO $$
DECLARE
  v_id bigint;
BEGIN
  CALL criar_servico('Teste Banco', 'Servico de teste', 10.00, 30, v_id);
  CALL atualizar_servico(v_id, 'Teste Banco', 'Servico alterado', 12.00, 45);
  CALL excluir_servico(v_id);
END;
$$;

SELECT id, nome, descricao, preco, duracao_min, ativo
FROM servicos
WHERE nome = 'Teste Banco';

CALL criar_servico('Invalido', 'Preco negativo', -5.00, 30, NULL);

DELETE FROM agendamentos WHERE inicio >= '2030-01-01';
DELETE FROM servicos WHERE nome = 'Teste Banco';
