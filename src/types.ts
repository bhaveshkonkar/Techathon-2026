export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'instructor' | 'student';
}

export interface Classroom {
  id: number;
  name: string;
  instructor_id: number;
  join_code: string;
}

export interface MCQ {
  id?: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
  difficulty?: 'medium' | 'straightforward' | 'tricky';
  topic_group_id?: string;
}

export interface Subtopic {
  id: number;
  lesson_id: number;
  title: string;
  video_url: string;
  sketchfab_id: string;
  order_index: number;
  mcqs: MCQ[];
}

export interface Lesson {
  id: number;
  classroom_id: number;
  title: string;
  order_index: number;
  subtopics: Subtopic[];
}

export interface Progress {
  subtopic_id: number;
  completed: boolean;
  mcq_score: number;
}
