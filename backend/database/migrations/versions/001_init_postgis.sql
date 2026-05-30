CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS trechos (
    id INTEGER PRIMARY KEY,
    km_inicio DOUBLE PRECISION NOT NULL,
    km_fim DOUBLE PRECISION NOT NULL,
    sentido VARCHAR(16) NOT NULL DEFAULT 'N/A',
    lado VARCHAR(16) NOT NULL DEFAULT 'N/A',
    tipo_area VARCHAR(64) NOT NULL DEFAULT 'faixa_dominio',
    nivel_rocada DOUBLE PRECISION NOT NULL DEFAULT 0,
    data_referencia DATE,
    status VARCHAR(16) NOT NULL DEFAULT 'ativo',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom geometry(LINESTRING, 4326),
    dias_sem_manutencao INTEGER NOT NULL DEFAULT 0,
    chuva_acumulada_mm DOUBLE PRECISION NOT NULL DEFAULT 0,
    criticidade_operacional DOUBLE PRECISION NOT NULL DEFAULT 0,
    risco_contratual DOUBLE PRECISION NOT NULL DEFAULT 0,
    iro DOUBLE PRECISION NOT NULL DEFAULT 0,
    classificacao VARCHAR(16) NOT NULL DEFAULT 'Normal',
    recomendacao_acao VARCHAR(255) NOT NULL DEFAULT 'Monitorar',
    recomendacao_prazo_dias INTEGER NOT NULL DEFAULT 30,
    recomendacao_metodo VARCHAR(128) NOT NULL DEFAULT 'Inspecao visual'
);

CREATE TABLE IF NOT EXISTS intervencoes (
    id SERIAL PRIMARY KEY,
    trecho_id INTEGER NOT NULL REFERENCES trechos(id),
    data_execucao DATE,
    tipo_intervencao VARCHAR(64) NOT NULL DEFAULT 'rocada',
    custo DOUBLE PRECISION NOT NULL DEFAULT 0,
    observacoes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS missoes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(32) UNIQUE NOT NULL,
    prioridade VARCHAR(16) NOT NULL DEFAULT 'Media',
    equipe VARCHAR(64) NOT NULL DEFAULT 'Equipe Operacional',
    tempo_estimado_h DOUBLE PRECISION NOT NULL DEFAULT 0,
    custo_estimado DOUBLE PRECISION NOT NULL DEFAULT 0,
    economia_logistica_estimada DOUBLE PRECISION NOT NULL DEFAULT 0,
    trecho_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    plano_semanal_ref VARCHAR(32) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indicadores (
    id SERIAL PRIMARY KEY,
    data_referencia DATE,
    total_trechos INTEGER NOT NULL DEFAULT 0,
    trechos_criticos INTEGER NOT NULL DEFAULT 0,
    indice_medio_iro DOUBLE PRECISION NOT NULL DEFAULT 0,
    economia_potencial DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    perfil VARCHAR(32) NOT NULL DEFAULT 'operador',
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clima (
    id SERIAL PRIMARY KEY,
    trecho_id INTEGER REFERENCES trechos(id),
    data_referencia DATE,
    chuva_mm DOUBLE PRECISION NOT NULL DEFAULT 0,
    temperatura_c DOUBLE PRECISION NOT NULL DEFAULT 0,
    umidade_percentual DOUBLE PRECISION NOT NULL DEFAULT 0,
    vento_kmh DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS auditorias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    evento VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
