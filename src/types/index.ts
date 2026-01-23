/* Type Definitions */
export interface Course {
    id: string;
    name: string;
    year: number;
    semester: 1 | 2;
    status: "pending" | "enrolled" | "done" | "failed" | "withdrawn" | "retake";
    prerequisites: string[];
    lastOpenedAt: Date | null;
}

export interface Major {
    id: string;
    name: string;
    university: string;
    courses: Course[];
}

export interface User {
    id: string;
    email: string;
    currentYear: number;
    major: Major | null;
}
