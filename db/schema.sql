-- Habilitação da extensão para geração de UUIDv4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (Pronta para Multitenancy e Autenticação)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Metas Nutricionais (Histórico de Alterações de Metas)
CREATE TABLE macro_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    protein_target INT NOT NULL,      -- meta em gramas
    carbs_target INT NOT NULL,        -- meta em gramas
    fat_target INT NOT NULL,          -- meta em gramas
    calories_target INT NOT NULL,     -- meta em kcal
    start_date DATE NOT NULL,         -- início da vigência da meta
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_goal_start_date UNIQUE (user_id, start_date)
);

-- 3. Tabela de Registros de Consumo (Log de Ingestão)
CREATE TABLE macro_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    protein INT NOT NULL DEFAULT 0,   -- consumido em gramas
    carbs INT NOT NULL DEFAULT 0,     -- consumido em gramas
    fat INT NOT NULL DEFAULT 0,       -- consumido em gramas
    calories INT NOT NULL DEFAULT 0,  -- calculado/inserido em kcal
    log_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- 'standard', 'snack', 'alcohol', 'cheat'
    consumption_date DATE NOT NULL,  -- data de consumo (crucial para agregação por calendário)
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Índices para Otimização de Performance e Agrupamentos
-- Otimiza a busca diária e filtros de intervalo de datas por usuário
CREATE INDEX idx_macro_logs_user_date ON macro_logs (user_id, consumption_date DESC);

-- Otimiza agrupamentos de metas por data de início
CREATE INDEX idx_macro_goals_user_date ON macro_goals (user_id, start_date DESC);
