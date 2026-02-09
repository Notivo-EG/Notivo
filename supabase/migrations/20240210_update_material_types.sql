-- Migration: Update course_materials type constraint to support new AI categories
-- This updates the CHECK constraint to allow the new material categories

-- Drop the existing constraint
ALTER TABLE course_materials DROP CONSTRAINT IF EXISTS course_materials_type_check;

-- Add new constraint with all categories (including legacy types for backwards compatibility)
ALTER TABLE course_materials ADD CONSTRAINT course_materials_type_check 
CHECK (type IN (
    -- New AI-detected categories
    'lecture_slides',
    'textbook',
    'past_exam',
    'problem_sheet',
    'notes',
    'research_paper',
    'lab_report',
    'syllabus',
    -- Legacy types for backwards compatibility
    'slide',
    'sheet',
    'reference_toc'
));
