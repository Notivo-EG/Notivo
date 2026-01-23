-- Add preferences column to profiles table
alter table profiles add column if not exists preferences jsonb default '{
  "darkMode": true,
  "reducedMotion": false,
  "soundEffects": true,
  "studyReminders": true,
  "examAlerts": true,
  "decayWarnings": true
}'::jsonb;
