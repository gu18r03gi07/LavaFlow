create table usuarios (
  id          bigint generated always as identity primary key,
  nome        text not null,
  email       text not null unique,
  senha_hash  text not null,
  telefone    text,
  papel       text not null default 'CLIENTE' check (papel in ('CLIENTE', 'ADMIN')),
  criado_em   timestamp not null default now()
);

create table veiculos (
  id          bigint generated always as identity primary key,
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  marca       text not null,
  modelo      text not null,
  placa       text not null,
  cor         text not null
);

create table servicos (
  id           bigint generated always as identity primary key,
  nome         text not null,
  descricao    text,
  preco        numeric(10,2) not null check (preco >= 0),
  duracao_min  int not null check (duracao_min > 0),
  ativo        boolean not null default true
);

create table boxes (
  id     bigint generated always as identity primary key,
  nome   text not null,
  ativo  boolean not null default true
);

-- inicio e fim são "timestamp" (sem fuso) de propósito:
-- a lavagem é num lugar só, então guardamos o horário local e evitamos dor de cabeça com fuso.
create table agendamentos (
  id          bigint generated always as identity primary key,
  usuario_id  bigint not null references usuarios(id),
  veiculo_id  bigint not null references veiculos(id),
  servico_id  bigint not null references servicos(id),
  box_id      bigint not null references boxes(id),
  inicio      timestamp not null,
  fim         timestamp not null,
  status      text not null default 'AGENDADO'
              check (status in ('AGENDADO','RECEBIDO','EM_LAVAGEM','CONCLUIDO','CANCELADO')),
  criado_em   timestamp not null default now(),
  check (fim > inicio)
);

-- dados iniciais
insert into servicos (nome, descricao, preco, duracao_min) values
  ('Lavagem Essencial', 'Lavagem externa, rodas, pneus e secagem manual.', 45.00, 60),
  ('Lavagem Completa', 'Limpeza externa e interna, aspiração e acabamento.', 79.90, 90),
  ('Detalhamento Premium', 'Higienização profunda, cera protetora e revitalização.', 149.90, 180);

insert into boxes (nome) values ('Box 01'), ('Box 02'), ('Box 03'), ('Box 04'), ('Box 05'), ('Box 06');

-- usuários de teste (o hash é falso; o login de verdade entra no passo 20)
insert into usuarios (nome, email, senha_hash, telefone, papel) values
  ('Marina Alves', 'marina@email.com', 'trocar-no-passo-20', '(11) 99999-9999', 'CLIENTE'),
  ('Unidade Centro', 'admin@lavaflow.com', 'trocar-no-passo-20', null, 'ADMIN');

insert into veiculos (usuario_id, marca, modelo, placa, cor) values
  ((select id from usuarios where email = 'marina@email.com'), 'Volkswagen', 'T-Cross', 'ABC-1D23', 'Cinza Platinum'),
  ((select id from usuarios where email = 'marina@email.com'), 'Honda', 'Civic', 'EKO-7F89', 'Branco');

-- segurança: o Supabase expõe uma API pública; sem policies ela não devolve nada.
-- O Java conecta direto no Postgres e não é afetado.
alter table usuarios     enable row level security;
alter table veiculos     enable row level security;
alter table servicos     enable row level security;
alter table boxes        enable row level security;
alter table agendamentos enable row level security;

create extension if not exists btree_gist;

-- o próprio banco impede dois agendamentos sobrepostos no mesmo box
alter table agendamentos add constraint sem_sobreposicao
  exclude using gist (box_id with =, tsrange(inicio, fim) with &&)
  where (status <> 'CANCELADO');