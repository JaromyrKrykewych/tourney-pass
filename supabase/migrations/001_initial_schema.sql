-- ==============================================================================
-- TourneyPass: Initial Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE tournament_format AS ENUM ('league', 'cup', 'group_playoff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tournament_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE collaborator_role AS ENUM ('owner', 'admin', 'editor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE collaborator_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled', 'walkover');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PROFILES TABLE (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    format tournament_format NOT NULL DEFAULT 'league',
    status tournament_status NOT NULL DEFAULT 'draft',
    logo_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{
        "points_win": 3,
        "points_draw": 1,
        "points_loss": 0,
        "two_legged": false,
        "extra_time": false,
        "penalties": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TOURNAMENT COLLABORATORS (Multi-admin & email invitations)
CREATE TABLE IF NOT EXISTS public.tournament_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invited_email TEXT NOT NULL,
    role collaborator_role NOT NULL DEFAULT 'admin',
    status collaborator_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (tournament_id, invited_email)
);

-- 6. PARTICIPANTS (Teams or players)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    seed INT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. GROUPS (For Group + PlayOff format)
CREATE TABLE IF NOT EXISTS public.tournament_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. GROUP PARTICIPANTS MAPPING
CREATE TABLE IF NOT EXISTS public.group_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (group_id, participant_id)
);

-- 9. MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.tournament_groups(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'regular',
    round_number INT NOT NULL DEFAULT 1,
    bracket_position INT,
    home_participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    away_participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    home_score INT,
    away_score INT,
    home_penalties INT,
    away_penalties INT,
    status match_status NOT NULL DEFAULT 'scheduled',
    next_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON public.tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON public.tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_collaborators_tournament ON public.tournament_collaborators(tournament_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON public.tournament_collaborators(invited_email);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON public.participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_groups_tournament ON public.tournament_groups(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON public.matches(tournament_id, round_number);

-- ==============================================================================
-- 11. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Auto create profile on auth signup & associate pending collaborator invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- If there were pending invitations for this email, link user_id
    UPDATE public.tournament_collaborators
    SET user_id = NEW.id
    WHERE LOWER(invited_email) = LOWER(NEW.email) AND user_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function: Check if current user is admin/owner of a tournament
CREATE OR REPLACE FUNCTION public.is_tournament_admin(target_tournament_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tournaments t
        WHERE t.id = target_tournament_id
        AND (
            t.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.tournament_collaborators tc
                WHERE tc.tournament_id = target_tournament_id
                AND tc.user_id = auth.uid()
                AND tc.status = 'accepted'
                AND tc.role IN ('owner', 'admin')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Check if current user can edit match scores (includes 'editor' role)
CREATE OR REPLACE FUNCTION public.can_edit_tournament(target_tournament_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tournaments t
        WHERE t.id = target_tournament_id
        AND (
            t.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.tournament_collaborators tc
                WHERE tc.tournament_id = target_tournament_id
                AND tc.user_id = auth.uid()
                AND tc.status = 'accepted'
                AND tc.role IN ('owner', 'admin', 'editor')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone"
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TOURNAMENTS POLICIES
DROP POLICY IF EXISTS "Public tournaments readable by everyone, draft by admins" ON public.tournaments;
CREATE POLICY "Public tournaments readable by everyone, draft by admins"
    ON public.tournaments FOR SELECT
    USING (is_public = true OR created_by = auth.uid() OR public.can_edit_tournament(id));

DROP POLICY IF EXISTS "Authenticated users can create tournaments" ON public.tournaments;
CREATE POLICY "Authenticated users can create tournaments"
    ON public.tournaments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update their tournaments" ON public.tournaments;
CREATE POLICY "Admins can update their tournaments"
    ON public.tournaments FOR UPDATE
    USING (public.is_tournament_admin(id));

DROP POLICY IF EXISTS "Owner can delete tournament" ON public.tournaments;
CREATE POLICY "Owner can delete tournament"
    ON public.tournaments FOR DELETE
    USING (created_by = auth.uid());

-- COLLABORATORS POLICIES
DROP POLICY IF EXISTS "Collaborators readable by tournament admins and invitee" ON public.tournament_collaborators;
CREATE POLICY "Collaborators readable by tournament admins and invitee"
    ON public.tournament_collaborators FOR SELECT
    USING (
        public.is_tournament_admin(tournament_id)
        OR user_id = auth.uid()
        OR LOWER(invited_email) = LOWER(auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "Admins can insert collaborators" ON public.tournament_collaborators;
CREATE POLICY "Admins can insert collaborators"
    ON public.tournament_collaborators FOR INSERT
    WITH CHECK (public.is_tournament_admin(tournament_id));

DROP POLICY IF EXISTS "Admins can update collaborators" ON public.tournament_collaborators;
CREATE POLICY "Admins can update collaborators"
    ON public.tournament_collaborators FOR UPDATE
    USING (
        public.is_tournament_admin(tournament_id)
        OR (user_id = auth.uid() OR LOWER(invited_email) = LOWER(auth.jwt()->>'email'))
    );

DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.tournament_collaborators;
CREATE POLICY "Admins can delete collaborators"
    ON public.tournament_collaborators FOR DELETE
    USING (public.is_tournament_admin(tournament_id));

-- PARTICIPANTS POLICIES
DROP POLICY IF EXISTS "Participants are readable by everyone" ON public.participants;
CREATE POLICY "Participants are readable by everyone"
    ON public.participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage participants" ON public.participants;
CREATE POLICY "Admins can manage participants"
    ON public.participants FOR ALL
    USING (public.is_tournament_admin(tournament_id))
    WITH CHECK (public.is_tournament_admin(tournament_id));

-- GROUPS POLICIES
DROP POLICY IF EXISTS "Groups are readable by everyone" ON public.tournament_groups;
CREATE POLICY "Groups are readable by everyone"
    ON public.tournament_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage groups" ON public.tournament_groups;
CREATE POLICY "Admins can manage groups"
    ON public.tournament_groups FOR ALL
    USING (public.is_tournament_admin(tournament_id))
    WITH CHECK (public.is_tournament_admin(tournament_id));

-- GROUP PARTICIPANTS POLICIES
DROP POLICY IF EXISTS "Group participants are readable by everyone" ON public.group_participants;
CREATE POLICY "Group participants are readable by everyone"
    ON public.group_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage group participants" ON public.group_participants;
CREATE POLICY "Admins can manage group participants"
    ON public.group_participants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tournament_groups tg
            WHERE tg.id = group_id AND public.is_tournament_admin(tg.tournament_id)
        )
    );

-- MATCHES POLICIES
DROP POLICY IF EXISTS "Matches are readable by everyone" ON public.matches;
CREATE POLICY "Matches are readable by everyone"
    ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Editors and Admins can update match scores" ON public.matches;
CREATE POLICY "Editors and Admins can update match scores"
    ON public.matches FOR ALL
    USING (public.can_edit_tournament(tournament_id))
    WITH CHECK (public.can_edit_tournament(tournament_id));
