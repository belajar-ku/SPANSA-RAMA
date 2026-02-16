-- 1. CLEANUP (Hati-hati, data lama hilang)
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS ramadan_targets CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. USERS
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'guru', 'murid')) NOT NULL,
    kelas TEXT,
    gender TEXT CHECK (gender IN ('L', 'P')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT users_username_key UNIQUE (username)
);

-- 3. APP SETTINGS
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TARGETS
CREATE TABLE ramadan_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    start_date DATE,
    target_puasa TEXT,
    target_tarawih TEXT,
    target_tadarus TEXT,
    target_karakter TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT ramadan_targets_user_id_key UNIQUE (user_id)
);

-- 5. DAILY LOGS (JURNAL HARIAN & SKOR)
CREATE TABLE daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- Ringkasan untuk Query Cepat
    puasa_type TEXT, -- 'penuh', 'setengah', 'tidak'
    total_points INTEGER DEFAULT 0,
    
    -- Data Detail (Sahur, Rincian Salat, Sedekah, dll) disimpan di sini
    details JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT daily_logs_user_date_key UNIQUE (user_id, date)
);

-- 6. POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ramadan_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Targets" ON ramadan_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Logs" ON daily_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. SEED DATA
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Admin Default
INSERT INTO users (username, password, name, role, gender)
VALUES ('admin', 'Spansa@1', 'Administrator', 'admin', 'L');

-- Config Default
INSERT INTO app_settings (key, value)
VALUES 
(
    'literasi_config', 
    '{"youtubeUrl": "https://www.youtube.com/watch?v=HuNqR6W4FjU", "questions": ["Jelaskan inti sari video tersebut!", "Apa hikmah yang bisa diambil?"]}'::jsonb
),
(
    'global_settings',
    '{"startRamadhanV1": "", "startRamadhanV2": "", "idulFitri": ""}'::jsonb
);