import { createClient } from "@/lib/supabase/client";
import { Infographic } from "@/lib/types";

export const infographicService = {
    async getAll(courseId: string): Promise<Infographic[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("infographics")
            .select("*")
            .eq("student_course_id", courseId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching infographics:", error);
            return [];
        }

        return data.map((item) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.image_url,
            sources: item.source_materials || [],
            createdAt: item.created_at,
            courseId: item.student_course_id,
        }));
    },

    async save(infographic: Infographic): Promise<Infographic | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("infographics")
            .insert({
                id: infographic.id,
                student_course_id: infographic.courseId,
                title: infographic.title,
                image_url: infographic.imageUrl,
                source_materials: infographic.sources,
                created_at: infographic.createdAt,
            })
            .select()
            .single();

        if (error) {
            console.error("Error saving infographic:", error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            imageUrl: data.image_url,
            sources: data.source_materials || [],
            createdAt: data.created_at,
            courseId: data.student_course_id,
        };
    },

    async delete(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from("infographics")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting infographic:", error);
            throw error;
        }
    },
};
