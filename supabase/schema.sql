-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  preferences jsonb default '{ "darkMode": true, "reducedMotion": false, "soundEffects": true, "studyReminders": true, "examAlerts": true, "decayWarnings": true }'::jsonb,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ENROLLMENTS (Multi-Major Support)
-- A user can have multiple enrollments (e.g., Major in CS, Minor in Art)
create table enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  university_name text not null,
  program_name text not null, -- e.g. "Computer Science"
  is_minor boolean default false,
  ui_theme text default 'default', -- 'cyber', 'minimal', 'paper', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. STUDENT COURSES (The Graph Nodes)
create table student_courses (
  id uuid default uuid_generate_v4() primary key,
  enrollment_id uuid references enrollments(id) on delete cascade not null,
  code text not null, -- e.g. "CS101"
  name text not null, -- e.g. "Intro to Computer Science"
  credits int default 3,
  
  -- Status flow: enrolled -> done (or failed)
  status text check (status in ('enrolled', 'done', 'failed', 'archived', 'locked')) default 'enrolled',
  
  -- Grades can be numeric (GPA) or letter, stored flexibly
  grade text, 
  
  -- AI Configuration for this course
  -- { "truth_source": "slides_heavy", "reference_name": "Gray's Anatomy" }
  source_config jsonb default '{}'::jsonb,
  
  -- Confidence score (0.0 - 1.0) of how complete our data is
  syllabus_completeness float default 0.0,
  
  -- Level 4: The Brain Additions
  pruning_config jsonb default '{}'::jsonb, -- Rules for ignoring textbook chapters
  extracurricular_plan jsonb default '{}'::jsonb, -- AI generated career roadmap
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. COURSE MATERIALS (Raw Data)
create table course_materials (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  
  -- What kind of file is this?
  -- What kind of file is this?
  type text check (type in ('syllabus', 'slide', 'sheet', 'reference_toc', 'past_exam', 'notes', 'problem_sheet')),
  
  title text,
  week_number int,
  content_url text not null, -- Supabase Storage URL
  
  -- AI Extraction results (e.g. OCR text, topics list)
  ai_summary jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MASTERY PROFILES (The Brain)
-- Stores granular analytics for a course
create table mastery_profiles (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  
  -- The core intelligence data
  -- Example: { "concepts": { "loops": 0.9, "recursion": 0.2 }, "cognitive": { "memory": 0.8, "analysis": 0.4 } }
  analytics_payload jsonb default '{}'::jsonb,
  
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PREREQUISITES (The Graph Edges)
create table course_prerequisites (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references student_courses(id) on delete cascade not null,
  prerequisite_code text not null, -- Stored as text code to allow flexible linking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Security)
alter table profiles enable row level security;
alter table enrollments enable row level security;
alter table student_courses enable row level security;
alter table course_materials enable row level security;
alter table mastery_profiles enable row level security;

-- Simple "User can only see their own data" policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own enrollments" on enrollments for select using (auth.uid() = user_id);
create policy "Users can insert own enrollments" on enrollments for insert with check (auth.uid() = user_id);
create policy "Users can update own enrollments" on enrollments for update using (auth.uid() = user_id);
create policy "Users can delete own enrollments" on enrollments for delete using (auth.uid() = user_id);

-- Helper for deep relations (Course -> Enrollment -> User)
-- For simplicity in development, we often use a check on the enrollment's user_id
create policy "Users can view own courses" on student_courses for select using (
  exists (select 1 from enrollments where id = student_courses.enrollment_id and user_id = auth.uid())
);
create policy "Users can insert own courses" on student_courses for insert with check (
  exists (select 1 from enrollments where id = student_courses.enrollment_id and user_id = auth.uid())
);
create policy "Users can update own courses" on student_courses for update using (
  exists (select 1 from enrollments where id = student_courses.enrollment_id and user_id = auth.uid())
);
create policy "Users can delete own courses" on student_courses for delete using (
  exists (select 1 from enrollments where id = student_courses.enrollment_id and user_id = auth.uid())
);

-- 7. FLASHCARDS (Active Recall)
create table flashcards (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  front text not null,
  back text not null,
  explanation text,
  type text default 'General',
  language text default 'English',
  tags text[] default '{}',
  is_bookmarked boolean default false,
  review_count int default 0,
  last_reviewed timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. VIDEO RECOMMENDATIONS (The Tutor)
create table video_recommendations (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  title text not null,
  description text, -- AI explanation of why this is relevant
  url text not null,
  provider text default 'youtube',
  start_time_seconds int default 0,
  relevance_score float default 0.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for New Tables
alter table flashcards enable row level security;
alter table video_recommendations enable row level security;

-- Flashcard Policies
create policy "Users can view own flashcards" on flashcards for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = flashcards.student_course_id and e.user_id = auth.uid())
);
create policy "Users can manage own flashcards" on flashcards for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = flashcards.student_course_id and e.user_id = auth.uid())
);

-- Video Policies
create policy "Users can view own videos" on video_recommendations for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = video_recommendations.student_course_id and e.user_id = auth.uid())
);
create policy "Users can manage own videos" on video_recommendations for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = video_recommendations.student_course_id and e.user_id = auth.uid())
);

-- 9. GENERATED SONGS (Educational Music)
create table generated_songs (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  title text,
  audio_url text not null,
  cover_url text,
  style text default 'Electronic Pop',
  prompt text,
  source_materials jsonb, -- [{id, title}]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table generated_videos (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  job_id text not null, -- Backend job ID
  title text,
  video_url text, -- Stored video URL
  config jsonb, -- {voice, detail_level, max_duration}
  source_materials jsonb, -- [{id, title}]
  status text default 'pending', -- pending, processing, completed, failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table infographics (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  title text,
  image_url text not null,
  source_materials jsonb, -- [{id, title}]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Generated Songs
alter table generated_songs enable row level security;

create policy "Users can view own songs" on generated_songs for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_songs.student_course_id and e.user_id = auth.uid())
);
create policy "Users can manage own songs" on generated_songs for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_songs.student_course_id and e.user_id = auth.uid())
);

-- RLS for Generated Videos
alter table generated_videos enable row level security;

create policy "Users can view own generated videos" on generated_videos for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_videos.student_course_id and e.user_id = auth.uid())
);
create policy "Users can manage own generated videos" on generated_videos for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_videos.student_course_id and e.user_id = auth.uid())
);

-- RLS for Infographics
alter table infographics enable row level security;

create policy "Users can view own infographics" on infographics for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = infographics.student_course_id and e.user_id = auth.uid())
);
create policy "Users can manage own infographics" on infographics for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = infographics.student_course_id and e.user_id = auth.uid())
);

-- 10. GENERATED EXAMS (Quiz History)
create table generated_exams (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  title text,
  exam_data jsonb, -- The full ExamResult object
  score_data jsonb, -- { correct, total, points, maxPoints }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Generated Exams
alter table generated_exams enable row level security;

create policy "Users can view own exams" on generated_exams for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_exams.student_course_id and e.user_id = auth.uid())
);
create policy "Users can manage own exams" on generated_exams for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_exams.student_course_id and e.user_id = auth.uid())
);

-- 11. EXAM FIGURES (AI-generated images for figure-type exam questions)
create table exam_figures (
  id uuid default uuid_generate_v4() primary key,
  generated_exam_id uuid references generated_exams(id) on delete cascade not null,
  question_id int not null,
  image_url text not null,
  prompt_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Exam Figures
alter table exam_figures enable row level security;

create policy "Users can view own exam figures" on exam_figures for select using (
  exists (
    select 1 from generated_exams ge
    join student_courses sc on ge.student_course_id = sc.id
    join enrollments e on sc.enrollment_id = e.id
    where ge.id = exam_figures.generated_exam_id and e.user_id = auth.uid()
  )
);
create policy "Users can manage own exam figures" on exam_figures for all using (
  exists (
    select 1 from generated_exams ge
    join student_courses sc on ge.student_course_id = sc.id
    join enrollments e on sc.enrollment_id = e.id
    where ge.id = exam_figures.generated_exam_id and e.user_id = auth.uid()
  )
);
