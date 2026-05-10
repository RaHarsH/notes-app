-- ──────────────────────────────────────────────────────────────
-- Collab Notes — PostgreSQL initialization script
-- Creates one database per service (database-per-service pattern)
-- Runs automatically on first postgres container start
-- POSTGRES_DB=collab is created automatically by the postgres image
-- ──────────────────────────────────────────────────────────────

CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE notes_db;
CREATE DATABASE history_db;
CREATE DATABASE comments_db;
CREATE DATABASE notifications_db;

-- Grant all privileges to the main user
GRANT ALL PRIVILEGES ON DATABASE auth_db TO collab;
GRANT ALL PRIVILEGES ON DATABASE user_db TO collab;
GRANT ALL PRIVILEGES ON DATABASE notes_db TO collab;
GRANT ALL PRIVILEGES ON DATABASE history_db TO collab;
GRANT ALL PRIVILEGES ON DATABASE comments_db TO collab;
GRANT ALL PRIVILEGES ON DATABASE notifications_db TO collab;
