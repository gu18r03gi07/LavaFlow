BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS usuarios (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome        text NOT NULL,
  email       text NOT NULL UNIQUE,
  senha_hash  text NOT NULL,
  telefone    text,
  papel       text NOT NULL DEFAULT 'CLIENTE'
              CHECK (papel IN ('CLIENTE', 'ADMIN')),
  criado_em   timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS veiculos (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  bigint NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  marca       text NOT NULL,
  modelo      text NOT NULL,
  placa       text NOT NULL,
  cor         text NOT NULL
);

CREATE TABLE IF NOT EXISTS servicos (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome         text NOT NULL,
  descricao    text,
  preco        numeric(10,2) NOT NULL CHECK (preco >= 0),
  duracao_min  int NOT NULL CHECK (duracao_min > 0),
  ativo        boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS boxes (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome   text NOT NULL,
  ativo  boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  bigint NOT NULL REFERENCES usuarios(id),
  veiculo_id  bigint NOT NULL REFERENCES veiculos(id),
  servico_id  bigint NOT NULL REFERENCES servicos(id),
  box_id      bigint NOT NULL REFERENCES boxes(id),
  inicio      timestamp NOT NULL,
  fim         timestamp NOT NULL,
  status      text NOT NULL DEFAULT 'AGENDADO'
              CHECK (status IN (
                'AGENDADO', 'RECEBIDO', 'EM_LAVAGEM', 'CONCLUIDO', 'CANCELADO'
              )),
  criado_em   timestamp NOT NULL DEFAULT now(),
  CHECK (fim > inicio)
);

CREATE TABLE IF NOT EXISTS historico_status_agendamento (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agendamento_id   bigint NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  status_anterior  text NOT NULL,
  status_novo      text NOT NULL,
  alterado_em      timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_inicio ON agendamentos (inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_usuario ON veiculos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_agendamento ON historico_status_agendamento (agendamento_id);

INSERT INTO servicos (nome, descricao, preco, duracao_min)
SELECT dados.nome, dados.descricao, dados.preco, dados.duracao_min
FROM (VALUES
  ('Lavagem Essencial', 'Lavagem externa, rodas, pneus e secagem manual.', 45.00, 60),
  ('Lavagem Completa', 'Limpeza externa e interna, aspiração e acabamento.', 79.90, 90),
  ('Detalhamento Premium', 'Higienização profunda, cera protetora e revitalização.', 149.90, 180)
) AS dados(nome, descricao, preco, duracao_min)
WHERE NOT EXISTS (
  SELECT 1 FROM servicos existente WHERE existente.nome = dados.nome
);

INSERT INTO boxes (nome)
SELECT dados.nome
FROM (VALUES
  ('Box 01'), ('Box 02'), ('Box 03'), ('Box 04'), ('Box 05'), ('Box 06')
) AS dados(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM boxes existente WHERE existente.nome = dados.nome
);

INSERT INTO usuarios (nome, email, senha_hash, telefone, papel)
SELECT dados.nome, dados.email, dados.senha_hash, dados.telefone, dados.papel
FROM (VALUES
  ('Marina Alves', 'marina@email.com', 'sem-senha-ate-implementar-login', '(11) 99999-9999', 'CLIENTE'),
  ('Unidade Centro', 'admin@lavaflow.com', 'sem-senha-ate-implementar-login', NULL, 'ADMIN')
) AS dados(nome, email, senha_hash, telefone, papel)
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios existente WHERE existente.email = dados.email
);

INSERT INTO veiculos (usuario_id, marca, modelo, placa, cor)
SELECT usuario.id, dados.marca, dados.modelo, dados.placa, dados.cor
FROM (VALUES
  ('marina@email.com', 'Volkswagen', 'T-Cross', 'ABC-1D23', 'Cinza Platinum'),
  ('marina@email.com', 'Honda', 'Civic', 'EKO-7F89', 'Branco')
) AS dados(email, marca, modelo, placa, cor)
JOIN usuarios usuario ON usuario.email = dados.email
WHERE NOT EXISTS (
  SELECT 1 FROM veiculos existente WHERE existente.placa = dados.placa
);

CREATE OR REPLACE VIEW vw_agendamentos_detalhados
WITH (security_invoker = true)
AS
SELECT
  a.id AS agendamento_id,
  a.usuario_id,
  u.nome AS cliente,
  a.veiculo_id,
  v.marca,
  v.modelo,
  v.placa,
  a.servico_id,
  s.nome AS servico,
  s.preco,
  s.duracao_min,
  a.box_id,
  b.nome AS box,
  a.inicio,
  a.fim,
  a.status
FROM agendamentos a
JOIN usuarios u ON u.id = a.usuario_id
JOIN veiculos v ON v.id = a.veiculo_id
JOIN servicos s ON s.id = a.servico_id
JOIN boxes b ON b.id = a.box_id;

CREATE OR REPLACE VIEW vw_resumo_agendamentos
WITH (security_invoker = true)
AS
SELECT
  a.inicio::date AS data,
  COUNT(*) FILTER (WHERE a.status <> 'CANCELADO')::integer AS agendamentos,
  COUNT(*) FILTER (WHERE a.status = 'EM_LAVAGEM')::integer AS em_atendimento,
  COUNT(*) FILTER (WHERE a.status = 'CONCLUIDO')::integer AS concluidos,
  COALESCE(
    SUM(s.preco) FILTER (WHERE a.status <> 'CANCELADO'),
    0
  ) AS faturamento_previsto
FROM agendamentos a
JOIN servicos s ON s.id = a.servico_id
GROUP BY a.inicio::date;

CREATE OR REPLACE FUNCTION definir_fim_agendamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_duracao_min int;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.inicio = OLD.inicio
     AND NEW.servico_id = OLD.servico_id THEN
    RETURN NEW;
  END IF;

  SELECT duracao_min
  INTO v_duracao_min
  FROM servicos
  WHERE id = NEW.servico_id;

  IF v_duracao_min IS NULL THEN
    RAISE EXCEPTION 'Serviço % não encontrado ou sem duração.', NEW.servico_id
      USING ERRCODE = '23503';
  END IF;

  NEW.fim := NEW.inicio + make_interval(mins => v_duracao_min);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_definir_fim_agendamento ON agendamentos;
CREATE TRIGGER trg_definir_fim_agendamento
BEFORE INSERT OR UPDATE OF inicio, servico_id
ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION definir_fim_agendamento();

CREATE OR REPLACE FUNCTION registrar_historico_status_agendamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_status_agendamento (
      agendamento_id, status_anterior, status_novo
    )
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_historico_status_agendamento ON agendamentos;
CREATE TRIGGER trg_historico_status_agendamento
AFTER UPDATE OF status
ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_status_agendamento();

CREATE OR REPLACE PROCEDURE criar_servico(
  IN p_nome text,
  IN p_descricao text,
  IN p_preco numeric,
  IN p_duracao_min int,
  OUT p_id bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_nome IS NULL OR btrim(p_nome) = ''
     OR p_preco IS NULL OR p_preco < 0
     OR p_duracao_min IS NULL OR p_duracao_min <= 0 THEN
    RAISE EXCEPTION 'Dados do serviço inválidos.'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO servicos (nome, descricao, preco, duracao_min)
  VALUES (btrim(p_nome), p_descricao, p_preco, p_duracao_min)
  RETURNING id INTO p_id;
END;
$$;

CREATE OR REPLACE PROCEDURE atualizar_servico(
  IN p_id bigint,
  IN p_nome text,
  IN p_descricao text,
  IN p_preco numeric,
  IN p_duracao_min int
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_nome IS NULL OR btrim(p_nome) = ''
     OR p_preco IS NULL OR p_preco < 0
     OR p_duracao_min IS NULL OR p_duracao_min <= 0 THEN
    RAISE EXCEPTION 'Dados do serviço inválidos.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE servicos
  SET nome = btrim(p_nome),
      descricao = p_descricao,
      preco = p_preco,
      duracao_min = p_duracao_min
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço % não encontrado.', p_id
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE excluir_servico(IN p_id bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE servicos
  SET ativo = false
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço % não encontrado.', p_id
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

ALTER TABLE usuarios                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status_agendamento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sem_sobreposicao'
      AND conrelid = 'agendamentos'::regclass
  ) THEN
    ALTER TABLE agendamentos
      ADD CONSTRAINT sem_sobreposicao
      EXCLUDE USING gist (
        box_id WITH =,
        tsrange(inicio, fim) WITH &&
      )
      WHERE (status <> 'CANCELADO');
  END IF;
END;
$$;

COMMIT;
