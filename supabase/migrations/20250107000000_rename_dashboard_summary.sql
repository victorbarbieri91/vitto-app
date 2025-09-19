-- Migration para renomear dashboard_summary para app_resumo_dashboard
-- Mantendo compatibilidade e seguindo padrão app_* em português

-- Renomear tabela para seguir padrão
ALTER TABLE IF EXISTS dashboard_summary 
RENAME TO app_resumo_dashboard;

-- Comentário da tabela
COMMENT ON TABLE app_resumo_dashboard IS 'Resumo do dashboard com métricas financeiras dos usuários';

-- Garantir que indexes e constraints sejam renomeados também
-- (o PostgreSQL automaticamente renomeia indexes, mas vamos ser explícitos)

-- Se houver alguma view ou função que referencia a tabela antiga, 
-- será necessário atualizar também

-- Criar view de compatibilidade temporária (opcional)
-- CREATE VIEW dashboard_summary AS SELECT * FROM app_resumo_dashboard;
-- COMMENT ON VIEW dashboard_summary IS 'View de compatibilidade - DEPRECATED: Use app_resumo_dashboard'; 