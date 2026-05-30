INSERT INTO usuarios (nome, email, perfil) VALUES
('Operador ORION', 'operador@motiva-orion.local', 'operador')
ON CONFLICT (email) DO NOTHING;
