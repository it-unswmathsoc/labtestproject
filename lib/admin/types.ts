import type { Course, LabTest, Question } from "@/lib/data/types";

export interface Content {
  courses: Course[];
  labTests: LabTest[];
  questions: Question[];
}
