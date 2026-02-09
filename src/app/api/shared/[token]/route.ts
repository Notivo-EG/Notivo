import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch all course data for a shared link (bypasses RLS)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    // 1. Look up the share token
    const { data: share, error: shareError } = await admin
      .from("course_shares")
      .select("*")
      .eq("share_token", token)
      .single();

    if (shareError || !share) {
      return NextResponse.json(
        { error: "Share link not found or has been revoked" },
        { status: 404 }
      );
    }

    const courseId = share.student_course_id;

    // 2. Fetch course info
    const { data: course } = await admin
      .from("student_courses")
      .select("id, code, name, enrollment_id, source_config, status")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // 3. Fetch owner profile
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("user_id, university_name, program_name")
      .eq("id", course.enrollment_id)
      .single();

    let ownerName = "Anonymous";
    if (enrollment) {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", enrollment.user_id)
        .single();
      if (profile?.full_name) ownerName = profile.full_name;
    }

    // 4. Fetch all content in parallel
    const [
      { data: materials },
      { data: flashcards },
      { data: songs },
      { data: videos },
      { data: infographics },
      { data: exams },
    ] = await Promise.all([
      admin
        .from("course_materials")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false }),
      admin
        .from("flashcards")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false }),
      admin
        .from("generated_songs")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false }),
      admin
        .from("generated_videos")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false }),
      admin
        .from("infographics")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false }),
      admin
        .from("generated_exams")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      course: {
        ...course,
        ownerName,
        university: enrollment?.university_name,
        program: enrollment?.program_name,
      },
      materials: materials || [],
      flashcards: flashcards || [],
      songs: songs || [],
      videos: videos || [],
      infographics: infographics || [],
      exams: exams || [],
    });
  } catch (error: any) {
    console.error("Shared data API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
