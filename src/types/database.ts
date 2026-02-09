export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            enrollments: {
                Row: {
                    id: string
                    user_id: string
                    university_name: string
                    program_name: string
                    is_minor: boolean
                    ui_theme: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    university_name: string
                    program_name: string
                    is_minor?: boolean
                    ui_theme?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    university_name?: string
                    program_name?: string
                    is_minor?: boolean
                    ui_theme?: string
                    created_at?: string
                }
            }
            student_courses: {
                Row: {
                    id: string
                    enrollment_id: string
                    code: string
                    name: string
                    credits: number
                    status: 'enrolled' | 'done' | 'failed' | 'archived' | 'locked'
                    grade: string | null
                    source_config: Json
                    syllabus_completeness: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    enrollment_id: string
                    code: string
                    name: string
                    credits?: number
                    status?: 'enrolled' | 'done' | 'failed' | 'archived' | 'locked'
                    grade?: string | null
                    source_config?: Json
                    syllabus_completeness?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    enrollment_id?: string
                    code?: string
                    name?: string
                    credits?: number
                    status?: 'enrolled' | 'done' | 'failed' | 'archived' | 'locked'
                    grade?: string | null
                    source_config?: Json
                    syllabus_completeness?: number
                    created_at?: string
                }
            }
            course_materials: {
                Row: {
                    id: string
                    student_course_id: string
                    type: 'lecture_slides' | 'textbook' | 'past_exam' | 'problem_sheet' | 'notes' | 'research_paper' | 'lab_report' | 'syllabus'
                    title: string | null
                    week_number: number | null
                    content_url: string
                    ai_summary: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_course_id: string
                    type: 'lecture_slides' | 'textbook' | 'past_exam' | 'problem_sheet' | 'notes' | 'research_paper' | 'lab_report' | 'syllabus'
                    title?: string | null
                    week_number?: number | null
                    content_url: string
                    ai_summary?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_course_id?: string
                    type?: 'lecture_slides' | 'textbook' | 'past_exam' | 'problem_sheet' | 'notes' | 'research_paper' | 'lab_report' | 'syllabus'
                    title?: string | null
                    week_number?: number | null
                    content_url?: string
                    ai_summary?: Json
                    created_at?: string
                }
            }
            mastery_profiles: {
                Row: {
                    id: string
                    student_course_id: string
                    analytics_payload: Json
                    last_updated: string
                }
                Insert: {
                    id?: string
                    student_course_id: string
                    analytics_payload?: Json
                    last_updated?: string
                }
                Update: {
                    id?: string
                    student_course_id?: string
                    analytics_payload?: Json
                    last_updated?: string
                }
            }
        }
    }
}
