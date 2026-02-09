-- Create the generated_videos table
create table if not exists generated_videos (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  job_id text not null, -- Backend job ID
  title text default 'Untitled Video',
  video_url text, -- Stored video URL (after upload)
  config jsonb, -- {voice, detail_level, max_duration}
  source_materials jsonb default '[]'::jsonb, -- [{id, title}]
  status text default 'pending', -- pending, processing, completed, failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table generated_videos enable row level security;

-- Policy: Allow users to view their own videos (linked via student_course)
create policy "Users can view videos for their courses"
  on generated_videos for select
  using (
    exists (
      select 1 from student_courses
      where student_courses.id = generated_videos.student_course_id
      and student_courses.user_id = auth.uid()
    )
  );

-- Policy: Allow users to insert videos for their courses
create policy "Users can insert videos for their courses"
  on generated_videos for insert
  with check (
    exists (
      select 1 from student_courses
      where student_courses.id = generated_videos.student_course_id
      and student_courses.user_id = auth.uid()
    )
  );

-- Policy: Allow users to update their videos
create policy "Users can update their videos"
  on generated_videos for update
  using (
    exists (
      select 1 from student_courses
      where student_courses.id = generated_videos.student_course_id
      and student_courses.user_id = auth.uid()
    )
  );
