import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// POST: Create or get existing share link for a course
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Verify user owns this course
    const { data: course, error: courseError } = await supabase
      .from("student_courses")
      .select("id, enrollment_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Check if share already exists
    const { data: existingShare } = await supabase
      .from("course_shares")
      .select("*")
      .eq("student_course_id", courseId)
      .single();

    if (existingShare) {
      return NextResponse.json({
        shareToken: existingShare.share_token,
        shareUrl: `${getBaseUrl(request)}/shared/${existingShare.share_token}`,
        isNew: false,
      });
    }

    // Create new share
    const shareToken = nanoid(12); // Short, URL-safe token
    const { data: newShare, error: insertError } = await supabase
      .from("course_shares")
      .insert({
        student_course_id: courseId,
        share_token: shareToken,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create share:", insertError);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      shareToken: newShare.share_token,
      shareUrl: `${getBaseUrl(request)}/shared/${newShare.share_token}`,
      isNew: true,
    });
  } catch (error: any) {
    console.error("Share API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
