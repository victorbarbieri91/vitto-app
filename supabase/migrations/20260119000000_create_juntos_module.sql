-- =============================================
-- MIGRATION: Modulo Juntos - Financas Compartilhadas
-- Projeto: Vitto Financas
-- Data: 2026-01-19
-- =============================================
-- Este arquivo cria as tabelas para compartilhamento
-- de financas entre casais/familias
-- =============================================

-- =============================================
-- PARTE 1: TABELAS PRINCIPAIS
-- =============================================

-- Tabela principal de grupos compartilhados
CREATE TABLE IF NOT EXISTS public.app_grupo_compartilhado (
    id bigserial PRIMARY KEY,
    nome text NOT NULL,
    criado_por uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo text DEFAULT 'casal' CHECK (tipo IN ('casal', 'familia', 'parceiros')),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de membros do grupo
CREATE TABLE IF NOT EXISTS public.app_grupo_membro (
    id bigserial PRIMARY KEY,
    grupo_id bigint REFERENCES public.app_grupo_compartilhado(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    papel text DEFAULT 'membro' CHECK (papel IN ('admin', 'membro')),
    apelido text,
    -- Permissoes granulares
    pode_ver_patrimonio boolean DEFAULT true,
    pode_ver_receitas boolean DEFAULT true,
    pode_ver_despesas boolean DEFAULT true,
    pode_ver_transacoes boolean DEFAULT false,
    pode_ver_metas boolean DEFAULT true,
    -- Status
    aceito_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(grupo_id, user_id)
);

-- Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS public.app_convite_grupo (
    id bigserial PRIMARY KEY,
    grupo_id bigint REFERENCES public.app_grupo_compartilhado(id) ON DELETE CASCADE NOT NULL,
    convidado_email text NOT NULL,
    convidado_user_id uuid REFERENCES auth.users(id),
    token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado', 'expirado')),
    mensagem_convite text,
    expira_em timestamp with time zone DEFAULT (now() + interval '7 days'),
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela de metas compartilhadas
CREATE TABLE IF NOT EXISTS public.app_meta_compartilhada (
    id bigserial PRIMARY KEY,
    grupo_id bigint REFERENCES public.app_grupo_compartilhado(id) ON DELETE CASCADE NOT NULL,
    titulo text NOT NULL,
    descricao text,
    valor_meta numeric NOT NULL CHECK (valor_meta > 0),
    valor_atual numeric DEFAULT 0,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    cor text,
    icone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de contribuicoes para metas compartilhadas
CREATE TABLE IF NOT EXISTS public.app_meta_contribuicao (
    id bigserial PRIMARY KEY,
    meta_id bigint REFERENCES public.app_meta_compartilhada(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    valor numeric NOT NULL CHECK (valor > 0),
    data date DEFAULT CURRENT_DATE,
    observacao text,
    created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- PARTE 2: INDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_grupo_compartilhado_criado_por ON public.app_grupo_compartilhado(criado_por);
CREATE INDEX IF NOT EXISTS idx_grupo_membro_grupo_id ON public.app_grupo_membro(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_membro_user_id ON public.app_grupo_membro(user_id);
CREATE INDEX IF NOT EXISTS idx_convite_grupo_token ON public.app_convite_grupo(token);
CREATE INDEX IF NOT EXISTS idx_convite_grupo_email ON public.app_convite_grupo(convidado_email);
CREATE INDEX IF NOT EXISTS idx_meta_compartilhada_grupo_id ON public.app_meta_compartilhada(grupo_id);
CREATE INDEX IF NOT EXISTS idx_meta_contribuicao_meta_id ON public.app_meta_contribuicao(meta_id);
CREATE INDEX IF NOT EXISTS idx_meta_contribuicao_user_id ON public.app_meta_contribuicao(user_id);

-- =============================================
-- PARTE 3: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.app_grupo_compartilhado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_grupo_membro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_convite_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_meta_compartilhada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_meta_contribuicao ENABLE ROW LEVEL SECURITY;

-- Politicas para app_grupo_compartilhado
CREATE POLICY "Membros podem ver grupo" ON public.app_grupo_compartilhado
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_grupo_membro
            WHERE grupo_id = app_grupo_compartilhado.id
              AND user_id = auth.uid()
              AND aceito_em IS NOT NULL
        )
    );

CREATE POLICY "Criador pode gerenciar grupo" ON public.app_grupo_compartilhado
    FOR ALL USING (auth.uid() = criado_por);

-- Politicas para app_grupo_membro
CREATE POLICY "Membros do grupo podem ver outros membros" ON public.app_grupo_membro
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = app_grupo_membro.grupo_id
              AND gm.user_id = auth.uid()
              AND gm.aceito_em IS NOT NULL
        )
    );

CREATE POLICY "Usuario pode gerenciar propria participacao" ON public.app_grupo_membro
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin pode gerenciar membros" ON public.app_grupo_membro
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = app_grupo_membro.grupo_id
              AND gm.user_id = auth.uid()
              AND gm.papel = 'admin'
              AND gm.aceito_em IS NOT NULL
        )
    );

-- Politicas para app_convite_grupo
CREATE POLICY "Admin pode gerenciar convites" ON public.app_convite_grupo
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.app_grupo_compartilhado g
            WHERE g.id = grupo_id AND g.criado_por = auth.uid()
        )
    );

CREATE POLICY "Convidado pode ver convite pelo email" ON public.app_convite_grupo
    FOR SELECT USING (
        convidado_email = (SELECT email FROM public.app_perfil WHERE id = auth.uid())
    );

-- Politicas para app_meta_compartilhada
CREATE POLICY "Membros podem ver metas" ON public.app_meta_compartilhada
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = app_meta_compartilhada.grupo_id
              AND gm.user_id = auth.uid()
              AND gm.aceito_em IS NOT NULL
              AND gm.pode_ver_metas = true
        )
    );

CREATE POLICY "Admin pode gerenciar metas" ON public.app_meta_compartilhada
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = app_meta_compartilhada.grupo_id
              AND gm.user_id = auth.uid()
              AND gm.papel = 'admin'
              AND gm.aceito_em IS NOT NULL
        )
    );

-- Politicas para app_meta_contribuicao
CREATE POLICY "Membros podem ver contribuicoes" ON public.app_meta_contribuicao
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_meta_compartilhada mc
            JOIN public.app_grupo_membro gm ON gm.grupo_id = mc.grupo_id
            WHERE mc.id = app_meta_contribuicao.meta_id
              AND gm.user_id = auth.uid()
              AND gm.aceito_em IS NOT NULL
        )
    );

CREATE POLICY "Usuario pode criar proprias contribuicoes" ON public.app_meta_contribuicao
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario pode deletar proprias contribuicoes" ON public.app_meta_contribuicao
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PARTE 4: FUNCOES RPC
-- =============================================

-- Funcao para criar grupo e adicionar criador como admin
CREATE OR REPLACE FUNCTION criar_grupo_juntos(p_nome text, p_tipo text DEFAULT 'casal')
RETURNS jsonb AS $$
DECLARE
    v_grupo_id bigint;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario nao autenticado');
    END IF;

    -- Criar grupo
    INSERT INTO public.app_grupo_compartilhado (nome, criado_por, tipo)
    VALUES (p_nome, v_user_id, p_tipo)
    RETURNING id INTO v_grupo_id;

    -- Adicionar criador como admin
    INSERT INTO public.app_grupo_membro (grupo_id, user_id, papel, aceito_em)
    VALUES (v_grupo_id, v_user_id, 'admin', now());

    RETURN jsonb_build_object(
        'success', true,
        'grupo_id', v_grupo_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para enviar convite
CREATE OR REPLACE FUNCTION enviar_convite_grupo(p_grupo_id bigint, p_email text, p_mensagem text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
    v_token uuid;
    v_convite_id bigint;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    -- Verificar se e admin do grupo
    IF NOT EXISTS (
        SELECT 1 FROM public.app_grupo_membro
        WHERE grupo_id = p_grupo_id AND user_id = v_user_id AND papel = 'admin' AND aceito_em IS NOT NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sem permissao para convidar');
    END IF;

    -- Verificar se ja e membro
    IF EXISTS (
        SELECT 1 FROM public.app_grupo_membro gm
        JOIN public.app_perfil p ON p.id = gm.user_id
        WHERE gm.grupo_id = p_grupo_id AND LOWER(p.email) = LOWER(p_email) AND gm.aceito_em IS NOT NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario ja e membro do grupo');
    END IF;

    -- Verificar se ja existe convite pendente para este email
    IF EXISTS (
        SELECT 1 FROM public.app_convite_grupo
        WHERE grupo_id = p_grupo_id AND LOWER(convidado_email) = LOWER(p_email) AND status = 'pendente' AND expira_em > now()
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ja existe um convite pendente para este email');
    END IF;

    -- Criar convite
    INSERT INTO public.app_convite_grupo (grupo_id, convidado_email, mensagem_convite)
    VALUES (p_grupo_id, LOWER(p_email), p_mensagem)
    RETURNING id, token INTO v_convite_id, v_token;

    RETURN jsonb_build_object(
        'success', true,
        'convite_id', v_convite_id,
        'token', v_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para aceitar convite
CREATE OR REPLACE FUNCTION aceitar_convite_grupo(p_token uuid)
RETURNS jsonb AS $$
DECLARE
    v_convite record;
    v_grupo record;
    v_user_id uuid;
    v_user_email text;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario nao autenticado');
    END IF;

    -- Buscar email do usuario logado
    SELECT email INTO v_user_email FROM public.app_perfil WHERE id = v_user_id;

    -- Buscar convite valido
    SELECT * INTO v_convite
    FROM public.app_convite_grupo
    WHERE token = p_token AND status = 'pendente' AND expira_em > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Convite invalido ou expirado');
    END IF;

    -- Verificar se email do convite corresponde ao usuario logado
    IF LOWER(v_convite.convidado_email) != LOWER(v_user_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este convite foi enviado para outro email');
    END IF;

    -- Buscar grupo
    SELECT * INTO v_grupo FROM public.app_grupo_compartilhado WHERE id = v_convite.grupo_id;

    IF NOT FOUND OR NOT v_grupo.ativo THEN
        RETURN jsonb_build_object('success', false, 'error', 'Grupo nao encontrado ou inativo');
    END IF;

    -- Criar membro
    INSERT INTO public.app_grupo_membro (grupo_id, user_id, papel, aceito_em)
    VALUES (v_convite.grupo_id, v_user_id, 'membro', now())
    ON CONFLICT (grupo_id, user_id) DO UPDATE SET aceito_em = now();

    -- Atualizar convite
    UPDATE public.app_convite_grupo
    SET status = 'aceito', convidado_user_id = v_user_id
    WHERE id = v_convite.id;

    RETURN jsonb_build_object(
        'success', true,
        'grupo_id', v_grupo.id,
        'grupo_nome', v_grupo.nome
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para obter dados consolidados do grupo
CREATE OR REPLACE FUNCTION obter_dados_grupo_juntos(p_grupo_id bigint, p_mes integer DEFAULT NULL, p_ano integer DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
    resultado jsonb;
    v_user_id uuid;
    v_mes integer;
    v_ano integer;
BEGIN
    v_user_id := auth.uid();
    v_mes := COALESCE(p_mes, EXTRACT(MONTH FROM CURRENT_DATE)::integer);
    v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::integer);

    -- Verificar se usuario e membro do grupo
    IF NOT EXISTS (
        SELECT 1 FROM public.app_grupo_membro
        WHERE grupo_id = p_grupo_id AND user_id = v_user_id AND aceito_em IS NOT NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Acesso negado ao grupo');
    END IF;

    -- Construir resultado consolidado
    SELECT jsonb_build_object(
        'success', true,
        'grupo_id', p_grupo_id,
        'mes', v_mes,
        'ano', v_ano,
        'patrimonio_total', COALESCE((
            SELECT SUM(
                CASE WHEN gm.pode_ver_patrimonio THEN
                    COALESCE((SELECT SUM(saldo_atual) FROM public.app_conta WHERE user_id = gm.user_id AND status = 'ativo'), 0)
                ELSE 0 END
            )
            FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = p_grupo_id AND gm.aceito_em IS NOT NULL
        ), 0),
        'receitas_mes', COALESCE((
            SELECT SUM(
                CASE WHEN gm.pode_ver_receitas THEN
                    COALESCE((SELECT SUM(valor) FROM public.app_transacoes
                     WHERE user_id = gm.user_id AND tipo = 'receita'
                     AND EXTRACT(MONTH FROM data) = v_mes
                     AND EXTRACT(YEAR FROM data) = v_ano), 0)
                ELSE 0 END
            )
            FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = p_grupo_id AND gm.aceito_em IS NOT NULL
        ), 0),
        'despesas_mes', COALESCE((
            SELECT SUM(
                CASE WHEN gm.pode_ver_despesas THEN
                    COALESCE((SELECT SUM(valor) FROM public.app_transacoes
                     WHERE user_id = gm.user_id AND tipo IN ('despesa', 'despesa_cartao')
                     AND EXTRACT(MONTH FROM data) = v_mes
                     AND EXTRACT(YEAR FROM data) = v_ano), 0)
                ELSE 0 END
            )
            FROM public.app_grupo_membro gm
            WHERE gm.grupo_id = p_grupo_id AND gm.aceito_em IS NOT NULL
        ), 0),
        'membros', (
            SELECT jsonb_agg(jsonb_build_object(
                'user_id', gm.user_id,
                'apelido', COALESCE(gm.apelido, p.nome),
                'avatar', p.avatar_url,
                'papel', gm.papel,
                'permissoes', jsonb_build_object(
                    'patrimonio', gm.pode_ver_patrimonio,
                    'receitas', gm.pode_ver_receitas,
                    'despesas', gm.pode_ver_despesas,
                    'transacoes', gm.pode_ver_transacoes,
                    'metas', gm.pode_ver_metas
                ),
                'patrimonio', CASE WHEN gm.pode_ver_patrimonio THEN
                    COALESCE((SELECT SUM(saldo_atual) FROM public.app_conta WHERE user_id = gm.user_id AND status = 'ativo'), 0)
                ELSE NULL END,
                'receitas_mes', CASE WHEN gm.pode_ver_receitas THEN
                    COALESCE((SELECT SUM(valor) FROM public.app_transacoes
                     WHERE user_id = gm.user_id AND tipo = 'receita'
                     AND EXTRACT(MONTH FROM data) = v_mes
                     AND EXTRACT(YEAR FROM data) = v_ano), 0)
                ELSE NULL END,
                'despesas_mes', CASE WHEN gm.pode_ver_despesas THEN
                    COALESCE((SELECT SUM(valor) FROM public.app_transacoes
                     WHERE user_id = gm.user_id AND tipo IN ('despesa', 'despesa_cartao')
                     AND EXTRACT(MONTH FROM data) = v_mes
                     AND EXTRACT(YEAR FROM data) = v_ano), 0)
                ELSE NULL END
            ) ORDER BY gm.papel DESC, gm.created_at ASC)
            FROM public.app_grupo_membro gm
            JOIN public.app_perfil p ON p.id = gm.user_id
            WHERE gm.grupo_id = p_grupo_id AND gm.aceito_em IS NOT NULL
        ),
        'metas_compartilhadas', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', mc.id,
                'titulo', mc.titulo,
                'descricao', mc.descricao,
                'valor_meta', mc.valor_meta,
                'valor_atual', mc.valor_atual,
                'percentual', ROUND((mc.valor_atual / mc.valor_meta) * 100, 1),
                'data_inicio', mc.data_inicio,
                'data_fim', mc.data_fim,
                'cor', mc.cor,
                'icone', mc.icone
            ) ORDER BY mc.data_fim ASC), '[]'::jsonb)
            FROM public.app_meta_compartilhada mc
            WHERE mc.grupo_id = p_grupo_id
        )
    ) INTO resultado;

    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para obter grupos do usuario
CREATE OR REPLACE FUNCTION obter_grupos_usuario()
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario nao autenticado', 'grupos', '[]'::jsonb);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'grupos', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', g.id,
                'nome', g.nome,
                'tipo', g.tipo,
                'papel', gm.papel,
                'criado_por', g.criado_por,
                'total_membros', (SELECT COUNT(*) FROM public.app_grupo_membro WHERE grupo_id = g.id AND aceito_em IS NOT NULL),
                'created_at', g.created_at
            ) ORDER BY g.created_at DESC)
            FROM public.app_grupo_compartilhado g
            JOIN public.app_grupo_membro gm ON gm.grupo_id = g.id
            WHERE gm.user_id = v_user_id AND gm.aceito_em IS NOT NULL AND g.ativo = true
        ), '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para atualizar permissoes de membro
CREATE OR REPLACE FUNCTION atualizar_permissoes_membro(
    p_grupo_id bigint,
    p_membro_user_id uuid,
    p_pode_ver_patrimonio boolean DEFAULT NULL,
    p_pode_ver_receitas boolean DEFAULT NULL,
    p_pode_ver_despesas boolean DEFAULT NULL,
    p_pode_ver_transacoes boolean DEFAULT NULL,
    p_pode_ver_metas boolean DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    -- Verificar se e admin do grupo ou o proprio usuario
    IF NOT EXISTS (
        SELECT 1 FROM public.app_grupo_membro
        WHERE grupo_id = p_grupo_id AND user_id = v_user_id AND papel = 'admin' AND aceito_em IS NOT NULL
    ) AND v_user_id != p_membro_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sem permissao para alterar');
    END IF;

    -- Atualizar permissoes
    UPDATE public.app_grupo_membro
    SET
        pode_ver_patrimonio = COALESCE(p_pode_ver_patrimonio, pode_ver_patrimonio),
        pode_ver_receitas = COALESCE(p_pode_ver_receitas, pode_ver_receitas),
        pode_ver_despesas = COALESCE(p_pode_ver_despesas, pode_ver_despesas),
        pode_ver_transacoes = COALESCE(p_pode_ver_transacoes, pode_ver_transacoes),
        pode_ver_metas = COALESCE(p_pode_ver_metas, pode_ver_metas)
    WHERE grupo_id = p_grupo_id AND user_id = p_membro_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para sair do grupo
CREATE OR REPLACE FUNCTION sair_grupo_juntos(p_grupo_id bigint)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_membro record;
    v_total_admins integer;
BEGIN
    v_user_id := auth.uid();

    -- Buscar membro
    SELECT * INTO v_membro
    FROM public.app_grupo_membro
    WHERE grupo_id = p_grupo_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voce nao e membro deste grupo');
    END IF;

    -- Se for admin, verificar se ha outros admins
    IF v_membro.papel = 'admin' THEN
        SELECT COUNT(*) INTO v_total_admins
        FROM public.app_grupo_membro
        WHERE grupo_id = p_grupo_id AND papel = 'admin' AND aceito_em IS NOT NULL;

        IF v_total_admins <= 1 THEN
            -- Verificar se ha outros membros
            IF EXISTS (SELECT 1 FROM public.app_grupo_membro WHERE grupo_id = p_grupo_id AND user_id != v_user_id AND aceito_em IS NOT NULL) THEN
                RETURN jsonb_build_object('success', false, 'error', 'Transfira a administracao para outro membro antes de sair');
            ELSE
                -- Ultimo membro, desativar grupo
                UPDATE public.app_grupo_compartilhado SET ativo = false WHERE id = p_grupo_id;
            END IF;
        END IF;
    END IF;

    -- Remover membro
    DELETE FROM public.app_grupo_membro WHERE grupo_id = p_grupo_id AND user_id = v_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para criar meta compartilhada
CREATE OR REPLACE FUNCTION criar_meta_compartilhada(
    p_grupo_id bigint,
    p_titulo text,
    p_valor_meta numeric,
    p_data_fim date,
    p_descricao text DEFAULT NULL,
    p_cor text DEFAULT NULL,
    p_icone text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_meta_id bigint;
BEGIN
    v_user_id := auth.uid();

    -- Verificar se e admin do grupo
    IF NOT EXISTS (
        SELECT 1 FROM public.app_grupo_membro
        WHERE grupo_id = p_grupo_id AND user_id = v_user_id AND papel = 'admin' AND aceito_em IS NOT NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem criar metas');
    END IF;

    -- Criar meta
    INSERT INTO public.app_meta_compartilhada (grupo_id, titulo, descricao, valor_meta, data_inicio, data_fim, cor, icone)
    VALUES (p_grupo_id, p_titulo, p_descricao, p_valor_meta, CURRENT_DATE, p_data_fim, p_cor, p_icone)
    RETURNING id INTO v_meta_id;

    RETURN jsonb_build_object('success', true, 'meta_id', v_meta_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para contribuir para meta
CREATE OR REPLACE FUNCTION contribuir_meta_compartilhada(
    p_meta_id bigint,
    p_valor numeric,
    p_observacao text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_meta record;
    v_grupo_id bigint;
BEGIN
    v_user_id := auth.uid();

    -- Buscar meta
    SELECT * INTO v_meta FROM public.app_meta_compartilhada WHERE id = p_meta_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Meta nao encontrada');
    END IF;

    v_grupo_id := v_meta.grupo_id;

    -- Verificar se e membro do grupo
    IF NOT EXISTS (
        SELECT 1 FROM public.app_grupo_membro
        WHERE grupo_id = v_grupo_id AND user_id = v_user_id AND aceito_em IS NOT NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voce nao e membro deste grupo');
    END IF;

    -- Criar contribuicao
    INSERT INTO public.app_meta_contribuicao (meta_id, user_id, valor, observacao)
    VALUES (p_meta_id, v_user_id, p_valor, p_observacao);

    -- Atualizar valor atual da meta
    UPDATE public.app_meta_compartilhada
    SET valor_atual = valor_atual + p_valor, updated_at = now()
    WHERE id = p_meta_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para buscar convite por token (publica)
CREATE OR REPLACE FUNCTION buscar_convite_por_token(p_token uuid)
RETURNS jsonb AS $$
DECLARE
    v_convite record;
    v_grupo record;
BEGIN
    -- Buscar convite
    SELECT * INTO v_convite
    FROM public.app_convite_grupo
    WHERE token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Convite nao encontrado');
    END IF;

    IF v_convite.status != 'pendente' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este convite ja foi ' || v_convite.status);
    END IF;

    IF v_convite.expira_em < now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este convite expirou');
    END IF;

    -- Buscar grupo
    SELECT * INTO v_grupo FROM public.app_grupo_compartilhado WHERE id = v_convite.grupo_id;

    RETURN jsonb_build_object(
        'success', true,
        'grupo_nome', v_grupo.nome,
        'grupo_tipo', v_grupo.tipo,
        'mensagem', v_convite.mensagem_convite,
        'expira_em', v_convite.expira_em
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PARTE 5: TRIGGER PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_app_grupo_compartilhado_updated_at
    BEFORE UPDATE ON public.app_grupo_compartilhado
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_meta_compartilhada_updated_at
    BEFORE UPDATE ON public.app_meta_compartilhada
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE public.app_grupo_compartilhado IS 'Grupos para compartilhamento de financas entre usuarios (casal, familia)';
COMMENT ON TABLE public.app_grupo_membro IS 'Membros de cada grupo com permissoes granulares';
COMMENT ON TABLE public.app_convite_grupo IS 'Convites pendentes para entrar em grupos';
COMMENT ON TABLE public.app_meta_compartilhada IS 'Metas financeiras compartilhadas entre membros do grupo';
COMMENT ON TABLE public.app_meta_contribuicao IS 'Historico de contribuicoes para metas compartilhadas';

COMMENT ON FUNCTION criar_grupo_juntos IS 'Cria um novo grupo Juntos e adiciona o criador como admin';
COMMENT ON FUNCTION enviar_convite_grupo IS 'Envia convite por email para entrar no grupo';
COMMENT ON FUNCTION aceitar_convite_grupo IS 'Aceita um convite pendente usando o token';
COMMENT ON FUNCTION obter_dados_grupo_juntos IS 'Retorna dados consolidados do grupo para o dashboard';
COMMENT ON FUNCTION obter_grupos_usuario IS 'Lista todos os grupos que o usuario participa';
