-- Apague as tabelas antigas se precisar recomeçar
DROP TABLE IF EXISTS produto, alerta, historico_etapa, etapa, linha_producao;


-- Tabela para descrever as linhas de produção
CREATE TABLE linha_producao (
    id SERIAL PRIMARY KEY,
    nome_linha VARCHAR(100) NOT NULL,
    localizacao VARCHAR(100)
);

-- Tabela para descrever as etapas possíveis
CREATE TABLE etapa (
    id SERIAL PRIMARY KEY,
    nome_etapa VARCHAR(100) NOT NULL,
    descricao TEXT
);

-- Tabela de PRODUTOS (agora muito mais enxuta)
-- Apenas armazena informações sobre o produto em si.
CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    n_serie VARCHAR(50) UNIQUE, -- O código de barras/SKU
    linha_id INT NOT NULL,
    status_geral VARCHAR(50) DEFAULT 'Em producao', -- "Em producao", "Concluido", "Cancelado"
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    
    CONSTRAINT fk_linha
        FOREIGN KEY(linha_id) 
        REFERENCES linha_producao(id)
);

-- Tabela para o HISTÓRICO da jornada de cada produto (A mais importante!)
-- Cada linha é um evento de entrada/saída de uma etapa.
CREATE TABLE historico_etapa (
    id SERIAL PRIMARY KEY,
    produto_id INT NOT NULL,
    etapa_id INT NOT NULL,
    inicio_ts TIMESTAMPTZ,
    fim_ts TIMESTAMPTZ, -- Fica NULL enquanto o produto está na etapa
    
    CONSTRAINT fk_produto
        FOREIGN KEY(produto_id) 
        REFERENCES produto(id)
		ON DELETE CASCADE,
    CONSTRAINT fk_etapa
        FOREIGN KEY(etapa_id) 
        REFERENCES etapa(id)
);

-- Tabela de ALERTAS (ligeiramente ajustada para usar as chaves estrangeiras)
CREATE TABLE alerta (
    id SERIAL PRIMARY KEY,
    linha_id INT NOT NULL,
    etapa_id INT, -- Pode ser nulo se a falha for geral da linha
    descricao TEXT NOT NULL,
    inicio_alerta_ts TIMESTAMPTZ NOT NULL,
    fim_alerta_ts TIMESTAMPTZ,
    status_alerta VARCHAR(50) DEFAULT 'Aberto',
    
    CONSTRAINT fk_linha_alerta
        FOREIGN KEY(linha_id) 
        REFERENCES linha_producao(id),
    CONSTRAINT fk_etapa_alerta
        FOREIGN KEY(etapa_id) 
        REFERENCES etapa(id)
);

-- Povoamento da tabela linha_producao
INSERT INTO linha_producao (nome_linha, localizacao) VALUES
('Linha 1', 'Galpão Superior'),
('Linha 2', 'Galpão Superior'),
('Linha 3', 'Galpão Superior'),
('Linha 4', 'Galpão Inferior'),
('Linha 5', 'Galpão Inferior');

-- Povoamento da tabela etapa
INSERT INTO etapa (nome_etapa, descricao) VALUES
('1 - MONTAGEM DA CARCAÇA', 'Montagem da carcaça do produto'),
('2 - MOTORIZAÇÃO DO CLIMATIZADOR', 'Motorização do climatizador'),
('3 - INSPEÇÃO INICIAL', 'Inspeção inicial do produto'),
('4 - FECHAMENTO DE ESTRUTURA', 'Fechamento da estrutura do produto'),
('5 - ACABAMENTO', 'Acabamento do produto');