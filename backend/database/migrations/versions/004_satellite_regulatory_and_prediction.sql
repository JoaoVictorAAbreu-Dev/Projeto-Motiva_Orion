ALTER TABLE trechos ADD COLUMN IF NOT EXISTS ndvi DOUBLE PRECISION;
ALTER TABLE trechos ADD COLUMN IF NOT EXISTS altura_vegetacao_predita_cm DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS regulatory_rules (
  id SERIAL PRIMARY KEY,
  key VARCHAR(96) UNIQUE NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

INSERT INTO regulatory_rules (key, value, description)
VALUES
  ('poda_altura_faixa_dominio_cm', 70, 'Altura maxima permitida na faixa de dominio'),
  ('poda_altura_entorno_instalacoes_cm', 50, 'Altura maxima permitida no entorno de instalacoes')
ON CONFLICT (key) DO NOTHING;
