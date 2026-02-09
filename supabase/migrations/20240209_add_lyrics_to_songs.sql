-- Add lyrics column to generated_songs table
alter table generated_songs 
add column if not exists lyrics text;
