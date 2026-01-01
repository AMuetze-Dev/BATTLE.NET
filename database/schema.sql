-- ============================================================================
-- Battle.Net Quiz-Plattform - PostgreSQL Database Schema
-- Version: 1.0
-- Erstellt: 2025-12-21
-- ============================================================================

-- Erweiterungen aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Tabelle: sessions
-- Speichert alle Quiz-Sessions (aktiv und abgeschlossen)
-- ============================================================================

CREATE TABLE sessions (
    id VARCHAR(6) PRIMARY KEY,                      -- z.B. 'ABC123'
    moderator_token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    question_catalog JSONB,                         -- Gecachtes XML als JSON
    current_question_id VARCHAR(50),                -- Aktuell angezeigte Frage
    metadata JSONB,                                 -- Zusätzliche Session-Metadaten
    game_mode VARCHAR(20) NOT NULL DEFAULT 'free-for-all',
    team_config JSONB,
    
    CONSTRAINT check_ended_at CHECK (
        (status = 'active' AND ended_at IS NULL) OR 
        (status = 'completed' AND ended_at IS NOT NULL)
    )
);

-- Indizes für sessions
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_moderator_token ON sessions(moderator_token);

-- ============================================================================
-- Tabelle: players
-- Speichert alle Spieler einer Session
-- ============================================================================

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(6) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    connected BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    team_id VARCHAR(50),                            -- Team membership (nullable for free-for-all mode)
    
    CONSTRAINT unique_player_name_per_session UNIQUE(session_id, name),
    CONSTRAINT check_score_non_negative CHECK (score >= 0),
    CONSTRAINT check_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indizes für players
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_score ON players(session_id, score DESC);
CREATE INDEX idx_players_connected ON players(session_id, connected);

-- ============================================================================
-- Tabelle: events
-- Audit-Log für alle wichtigen Session-Events
-- ============================================================================

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(6) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,                -- z.B. 'QUESTION_STARTED', 'POINTS_AWARDED'
    actor VARCHAR(100),                             -- Spieler-Name oder 'moderator' oder 'system'
    payload JSONB,                                  -- Event-spezifische Daten
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indizes für events
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_timestamp ON events(session_id, timestamp DESC);
CREATE INDEX idx_events_type ON events(event_type);

-- ============================================================================
-- Tabelle: questions
-- Cache für Fragen aus dem hochgeladenen Katalog
-- ============================================================================

CREATE TABLE questions (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(6) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'input-text', 'input-number', 'slider', 'multiple-choice',
        'buzzer', 'image-question', 'hotspot', 'sorting'
    )),
    prompt TEXT NOT NULL,
    data JSONB NOT NULL,                            -- Fragetyp-spezifische Daten
    image_url VARCHAR(500),
    correct_answer JSONB,                           -- Richtige Antwort(en)
    points INTEGER NOT NULL DEFAULT 1,
    order_in_category INTEGER NOT NULL,
    
    CONSTRAINT unique_question_id_per_session UNIQUE(session_id, id),
    CONSTRAINT check_points_positive CHECK (points > 0)
);

-- Indizes für questions
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_category ON questions(session_id, category_id, order_in_category);

-- ============================================================================
-- Tabelle: answers
-- Speichert alle Spieler-Antworten für spätere Analyse
-- ============================================================================

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(6) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,                          -- Die gegebene Antwort
    is_correct BOOLEAN,                             -- NULL = noch nicht bewertet
    points_awarded INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    evaluated_at TIMESTAMP WITH TIME ZONE,
    evaluated_by VARCHAR(100),                      -- 'auto' oder Moderator-Name
    
    CONSTRAINT unique_answer_per_player_question UNIQUE(session_id, question_id, player_id),
    FOREIGN KEY (session_id, question_id) REFERENCES questions(session_id, id) ON DELETE CASCADE
);

-- Indizes für answers
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_question_id ON answers(session_id, question_id);
CREATE INDEX idx_answers_player_id ON answers(player_id);
CREATE INDEX idx_answers_submitted_at ON answers(submitted_at);

-- ============================================================================
-- Tabelle: buzzer_presses
-- Speichert alle Buzzer-Events (für Gewinner-Ermittlung)
-- ============================================================================

CREATE TABLE buzzer_presses (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(6) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    client_timestamp BIGINT NOT NULL,               -- Client-Timestamp (ms)
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    
    FOREIGN KEY (session_id, question_id) REFERENCES questions(session_id, id) ON DELETE CASCADE
);

-- Indizes für buzzer_presses
CREATE INDEX idx_buzzer_session_question ON buzzer_presses(session_id, question_id);
CREATE INDEX idx_buzzer_server_timestamp ON buzzer_presses(server_timestamp);

-- ============================================================================
-- Views für häufige Queries
-- ============================================================================

-- View: Aktive Sessions mit Spieler-Anzahl
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    s.id,
    s.moderator_token,
    s.created_at,
    s.current_question_id,
    COUNT(p.id) AS player_count,
    COUNT(p.id) FILTER (WHERE p.connected = TRUE) AS connected_players
FROM sessions s
LEFT JOIN players p ON s.id = p.session_id
WHERE s.status = 'active'
GROUP BY s.id, s.moderator_token, s.created_at, s.current_question_id;

-- View: Scoreboard pro Session
CREATE OR REPLACE VIEW scoreboards AS
SELECT 
    p.session_id,
    p.name,
    p.score,
    p.connected,
    p.joined_at,
    ROW_NUMBER() OVER (PARTITION BY p.session_id ORDER BY p.score DESC, p.joined_at ASC) AS rank
FROM players p
ORDER BY p.session_id, rank;

-- View: Session-Statistiken
CREATE OR REPLACE VIEW session_statistics AS
SELECT 
    s.id AS session_id,
    s.status,
    s.created_at,
    s.ended_at,
    COUNT(DISTINCT p.id) AS total_players,
    COUNT(DISTINCT q.id) AS total_questions,
    COUNT(DISTINCT a.id) AS total_answers,
    COUNT(DISTINCT e.id) AS total_events,
    MAX(p.score) AS highest_score,
    AVG(p.score) AS average_score,
    EXTRACT(EPOCH FROM (COALESCE(s.ended_at, NOW()) - s.created_at)) AS duration_seconds
FROM sessions s
LEFT JOIN players p ON s.id = p.session_id
LEFT JOIN questions q ON s.id = q.session_id
LEFT JOIN answers a ON s.id = a.session_id
LEFT JOIN events e ON s.id = e.session_id
GROUP BY s.id, s.status, s.created_at, s.ended_at;

-- ============================================================================
-- Funktionen
-- ============================================================================

-- Funktion: Session-ID generieren (6 alphanumerische Zeichen)
CREATE OR REPLACE FUNCTION generate_session_id()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Prüfen, ob ID bereits existiert
    WHILE EXISTS(SELECT 1 FROM sessions WHERE id = result) LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Spieler-Score aktualisieren
CREATE OR REPLACE FUNCTION update_player_score(
    p_session_id VARCHAR(6),
    p_player_name VARCHAR(100),
    p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE players
    SET score = score + p_points,
        last_seen = NOW()
    WHERE session_id = p_session_id AND name = p_player_name;
    
    -- Event loggen
    INSERT INTO events (session_id, event_type, actor, payload)
    VALUES (
        p_session_id,
        'POINTS_AWARDED',
        p_player_name,
        jsonb_build_object('points', p_points)
    );
END;
$$ LANGUAGE plpgsql;

-- Funktion: Session beenden
CREATE OR REPLACE FUNCTION end_session(p_session_id VARCHAR(6))
RETURNS VOID AS $$
BEGIN
    UPDATE sessions
    SET status = 'completed',
        ended_at = NOW()
    WHERE id = p_session_id AND status = 'active';
    
    -- Alle Spieler disconnecten
    UPDATE players
    SET connected = FALSE
    WHERE session_id = p_session_id;
    
    -- Event loggen
    INSERT INTO events (session_id, event_type, actor)
    VALUES (p_session_id, 'SESSION_ENDED', 'moderator');
END;
$$ LANGUAGE plpgsql;

-- Funktion: Cleanup alte Sessions (älter als 30 Tage)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM sessions
        WHERE status = 'completed'
        AND ended_at < NOW() - INTERVAL '30 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger
-- ============================================================================

-- Trigger: Automatisches Update von last_seen bei Spieler-Aktivität
CREATE OR REPLACE FUNCTION update_player_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players
    SET last_seen = NOW()
    WHERE id = NEW.player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_seen_on_answer
AFTER INSERT ON answers
FOR EACH ROW
EXECUTE FUNCTION update_player_last_seen();

CREATE TRIGGER trigger_update_last_seen_on_buzzer
AFTER INSERT ON buzzer_presses
FOR EACH ROW
EXECUTE FUNCTION update_player_last_seen();

-- ============================================================================
-- Beispiel-Daten (für Entwicklung)
-- ============================================================================

-- Deaktivieren für Production!
-- INSERT INTO sessions (id, moderator_token, status)
-- VALUES ('TEST01', uuid_generate_v4(), 'active');

-- INSERT INTO players (session_id, name, score)
-- VALUES 
--     ('TEST01', 'Alice', 10),
--     ('TEST01', 'Bob', 5),
--     ('TEST01', 'Charlie', 15);

-- ============================================================================
-- Berechtigungen (anpassen je nach Setup)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO battlenet_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO battlenet_app;

-- ============================================================================
-- Maintenance
-- ============================================================================

-- Cron-Job für automatisches Cleanup (z.B. täglich)
-- SELECT cleanup_old_sessions();

-- Vacuum für Performance
-- VACUUM ANALYZE sessions;
-- VACUUM ANALYZE players;
-- VACUUM ANALYZE events;
-- VACUUM ANALYZE answers;

-- ============================================================================
-- Ende des Schemas
-- ============================================================================
