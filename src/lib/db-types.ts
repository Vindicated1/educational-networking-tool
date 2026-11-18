export type UserRole = "Student" | "Faculty" | "Admin";

export type DbUser = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
};

export type DbThread = {
  id: number;
  title: string;
  course: string;
  category: string;
  author: string;
  body: string;
  votes: number;
  created_at: string;
};

export type DbComment = {
  id: number;
  thread_id: number;
  author: string;
  role: UserRole;
  body: string;
  verified: boolean;
  created_at: string;
};

export type ThreadWithComments = DbThread & { comments: Omit<DbComment, "thread_id" | "created_at">[] };

export type DbResource = {
  id: number;
  title: string;
  course: string;
  session: string;
  format: string;
  size: string;
  uploaded_by: string;
  created_at: string;
  file_name: string | null;
  storage_key: string | null;
};

export type DbProject = {
  id: number;
  title: string;
  summary: string;
  required_skills: string;
  owner: string;
  match: number;
  created_at: string;
};

export type ModerationItem = {
  id: number;
  type: string;
  title: string;
  owner: string;
  urgency: string;
  status: string;
};

export type NewUser = Pick<DbUser, "full_name" | "email" | "password_hash" | "role">;
export type NewThread = Pick<DbThread, "title" | "course" | "category" | "author" | "body">;
export type NewResource = Pick<DbResource, "title" | "course" | "session" | "format" | "size" | "uploaded_by" | "file_name" | "storage_key">;
export type NewProject = Pick<DbProject, "title" | "summary" | "required_skills" | "owner">;
