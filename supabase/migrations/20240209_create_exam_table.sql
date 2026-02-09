-- Create generated_exams table
create table if not exists generated_exams (
  id uuid default uuid_generate_v4() primary key,
  student_course_id uuid references student_courses(id) on delete cascade not null,
  title text,
  exam_data jsonb not null, -- Stores the full ExamResult
  score_data jsonb, -- Stores user's latest score {correct, total, points, maxPoints}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table generated_exams enable row level security;

-- Policies
create policy "Users can view own exams" on generated_exams for select using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_exams.student_course_id and e.user_id = auth.uid())
);

create policy "Users can manage own exams" on generated_exams for all using (
  exists (select 1 from student_courses sc join enrollments e on sc.enrollment_id = e.id where sc.id = generated_exams.student_course_id and e.user_id = auth.uid())
);
