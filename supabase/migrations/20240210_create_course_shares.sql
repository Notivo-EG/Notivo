-- Course Shares: Enables public sharing of course content via unique tokens
create table course_shares (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null unique, -- One share per course
  share_token text not null unique, -- Short unique token for URLs
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast token lookups
create index idx_course_shares_token on course_shares(share_token);

-- RLS
alter table course_shares enable row level security;

-- Owner can manage their own shares
create policy "Users can view own shares" on course_shares for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = course_shares.student_course_id and e.user_id = auth.uid())
);
create policy "Users can insert own shares" on course_shares for insert with check (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = course_shares.student_course_id and e.user_id = auth.uid())
);
create policy "Users can delete own shares" on course_shares for delete using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = course_shares.student_course_id and e.user_id = auth.uid())
);

-- Public can read shares by token (needed for the shared view to validate tokens)
create policy "Anyone can read shares by token" on course_shares for select using (true);
