import Database from "better-sqlite3";
import fs from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "@/lib/auth";
import { courseOptions, defaultCourse } from "@/lib/courses";
import type {
  DbComment,
  DbProject,
  DbResource,
  DbThread,
  DbUser,
  ModerationItem,
  NewProject,
  NewResource,
  NewThread,
  NewUser,
  ThreadWithComments,
} from "@/lib/db-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "education-network.db");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Student',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    role TEXT NOT NULL,
    body TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    session TEXT NOT NULL,
    format TEXT NOT NULL,
    size TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    owner TEXT NOT NULL,
    match INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id),
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS moderation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    urgency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const resourceColumns = db.prepare("PRAGMA table_info(resources)").all() as Array<{ name: string }>;
if (!resourceColumns.some((column) => column.name === "file_name")) {
  db.exec("ALTER TABLE resources ADD COLUMN file_name TEXT");
}
if (!resourceColumns.some((column) => column.name === "storage_key")) {
  db.exec("ALTER TABLE resources ADD COLUMN storage_key TEXT");
}

db.prepare("UPDATE threads SET course = ? WHERE course = ?").run(courseOptions[0], "CSC 476");
db.prepare("UPDATE threads SET course = ? WHERE course = ?").run(courseOptions[1], "CSC 332");
db.prepare("UPDATE resources SET course = ? WHERE course = ?").run(courseOptions[0], "CSC 476");
db.prepare("UPDATE resources SET course = ? WHERE course = ?").run(courseOptions[1], "CSC 332");
db.prepare(
  `UPDATE threads
   SET title = ?, body = ?
   WHERE title = ?`,
).run(
  "How do I choose a research methodology for my project?",
  "I am planning a research project and need help choosing an appropriate methodology. What factors should I consider?",
  "Best way to prepare for the CSC 476 project presentation?",
);
db.prepare(
  "UPDATE resources SET title = ? WHERE title = ?",
).run("CSC476 Research Methodology Lecture Notes", "CSC 476 Software Engineering Lecture Slides");
db.prepare(
  "UPDATE resources SET title = ? WHERE title = ?",
).run("CSC302 System Analysis and Design Practice Questions", "Database Normalization Practice Questions");
db.prepare(
  `UPDATE comments
   SET body = ?
   WHERE thread_id IN (SELECT id FROM threads WHERE title = ?)
     AND body = ?`,
).run(
  "I compared the methods against my research question and the kind of evidence I needed to collect.",
  "How do I choose a research methodology for my project?",
  "I used a slide structure with problem, solution, architecture, testing, and outcomes. It worked well.",
);
db.prepare(
  `UPDATE comments
   SET body = ?
   WHERE thread_id IN (SELECT id FROM threads WHERE title = ?)
     AND body = ?`,
).run(
  "Start with your research question, then compare suitable qualitative, quantitative, or mixed-method approaches.",
  "How do I choose a research methodology for my project?",
  "Focus on requirements traceability, sprint evidence, and a 5-minute walkthrough of the most important user journey.",
);

const seededUserCount = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
if (seededUserCount.count === 0) {
  const defaultAdminPassword = hashPassword("admin123");
  db.prepare(
    `INSERT OR IGNORE INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  ).run("Admin User", "admin@ui.edu.ng", defaultAdminPassword, "Admin");

  const defaultStudentPassword = hashPassword("password123");
  db.prepare(
    `INSERT OR IGNORE INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  ).run("Ada Okafor", "20234567@stu.ui.edu.ng", defaultStudentPassword, "Student");
}

const seededThreadCount = db.prepare("SELECT COUNT(*) AS count FROM threads").get() as { count: number };
if (seededThreadCount.count === 0) {
  const createThread = db.prepare(
    `INSERT INTO threads (title, course, category, author, body, votes) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const createComment = db.prepare(
    `INSERT INTO comments (thread_id, author, role, body, verified) VALUES (?, ?, ?, ?, ?)`
  );

  const thread1 = createThread.run(
    "How do I choose a research methodology for my project?",
    defaultCourse,
    "Question",
    "Aisha M.",
    "I am planning a research project and need help choosing an appropriate methodology. What factors should I consider?",
    42,
  );

  createComment.run(Number(thread1.lastInsertRowid), "Prof. Okafor", "Faculty", "Start with your research question, then compare suitable qualitative, quantitative, or mixed-method approaches.", 1);
  createComment.run(Number(thread1.lastInsertRowid), "Daniel A.", "Student", "I compared the methods against my research question and the kind of evidence I needed to collect.", 0);

  const thread2 = createThread.run(
    "UI student team looking for a designer for campus event app",
    "General",
    "Discussion",
    "Samuel T.",
    "We are building an event discovery app for students and need help with UX flows and mockups before next sprint.",
    18,
  );

  createComment.run(Number(thread2.lastInsertRowid), "Grace O.", "Student", "I can help with mobile wireframes and user flow diagrams.", 0);
}

const seededResourceCount = db.prepare("SELECT COUNT(*) AS count FROM resources").get() as { count: number };
if (seededResourceCount.count === 0) {
  db.prepare(
    `INSERT INTO resources (title, course, session, format, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    "CSC476 Research Methodology Lecture Notes",
    defaultCourse,
    "2026/2027",
    "PDF",
    "2.4 MB",
    "Faculty",
  );

  db.prepare(
    `INSERT INTO resources (title, course, session, format, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    "CSC302 System Analysis and Design Practice Questions",
    courseOptions[1],
    "2025/2026",
    "DOCX",
    "680 KB",
    "Student",
  );

  db.prepare(
    `INSERT INTO resources (title, course, session, format, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    "Project Proposal Template",
    "General",
    "2026/2027",
    "DOCX",
    "1.1 MB",
    "Faculty",
  );
}

const seededProjectCount = db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number };
if (seededProjectCount.count === 0) {
  db.prepare(
    `INSERT INTO projects (title, summary, required_skills, owner, match) VALUES (?, ?, ?, ?, ?)`
  ).run(
    "Campus Study Buddy Matching",
    "A system for pairing students with peer tutors across departments.",
    JSON.stringify(["Python", "UI/UX", "Research"]),
    "Mariam",
    92,
  );

  db.prepare(
    `INSERT INTO projects (title, summary, required_skills, owner, match) VALUES (?, ?, ?, ?, ?)`
  ).run(
    "Smart Library Queue Tracker",
    "Improve seat and desk availability tracking for faculty and students.",
    JSON.stringify(["React", "Data Analysis", "Product Design"]),
    "Kingsley",
    71,
  );

  db.prepare(
    `INSERT INTO projects (title, summary, required_skills, owner, match) VALUES (?, ?, ?, ?, ?)`
  ).run(
    "Faculty Office Hours Planner",
    "Help students schedule meetings and view faculty availability.",
    JSON.stringify(["UX Research", "Next.js", "API Design"]),
    "Bola",
    64,
  );
}

const seededModerationCount = db.prepare("SELECT COUNT(*) AS count FROM moderation_items").get() as { count: number };
if (seededModerationCount.count === 0) {
  const insertModerationItem = db.prepare(
    "INSERT INTO moderation_items (type, title, owner, urgency, status) VALUES (?, ?, ?, ?, ?)",
  );
  insertModerationItem.run("Thread", "Unverified project plagiarism claim", "Aisha M.", "High", "Pending review");
  insertModerationItem.run("Resource", "Lecture notes uploaded without metadata", "Faculty Admin", "Medium", "Awaiting validation");
  insertModerationItem.run("Account", "New faculty verification request", "Dr. Bala", "Low", "Profile review");
}

export function serializeUser(user: DbUser) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
  };
}

export function getUserByEmail(email: string) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as DbUser | undefined;
}

export function getUserById(id: number) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined;
}

export function getThreads(): ThreadWithComments[] {
  const rows = db.prepare("SELECT * FROM threads ORDER BY created_at DESC").all() as DbThread[];

  return rows.map((thread) => {
    const comments = db
      .prepare(
        `SELECT * FROM comments WHERE thread_id = ? ORDER BY id ASC`
      )
      .all(thread.id) as Array<Omit<DbComment, "thread_id" | "created_at" | "verified"> & { verified: number }>;

    return {
      id: thread.id,
      title: thread.title,
      course: thread.course,
      category: thread.category,
      author: thread.author,
      body: thread.body,
      votes: thread.votes,
      created_at: thread.created_at,
      comments: comments.map((comment) => ({
        id: comment.id,
        author: comment.author,
        role: comment.role,
        body: comment.body,
        verified: Boolean(comment.verified),
      })),
    };
  });
}

export function getResources(): DbResource[] {
  return db.prepare("SELECT * FROM resources ORDER BY created_at DESC").all() as DbResource[];
}

export function getProjects(): DbProject[] {
  return db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all() as DbProject[];
}

export function createProject(input: NewProject): DbProject {
  const result = db
    .prepare("INSERT INTO projects (title, summary, required_skills, owner) VALUES (?, ?, ?, ?)")
    .run(input.title, input.summary, input.required_skills, input.owner);
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(Number(result.lastInsertRowid)) as DbProject;
}

export function getModerationQueue(): ModerationItem[] {
  return db.prepare("SELECT id, type, title, owner, urgency, status FROM moderation_items ORDER BY id ASC").all() as ModerationItem[];
}

export function createUser(input: NewUser): DbUser {
  const result = db
    .prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(input.full_name, input.email, input.password_hash, input.role);
  return getUserById(Number(result.lastInsertRowid))!;
}

export function createThread(input: NewThread): ThreadWithComments {
  const result = db
    .prepare("INSERT INTO threads (title, course, category, author, body) VALUES (?, ?, ?, ?, ?)")
    .run(input.title, input.course, input.category, input.author, input.body);
  return getThreads().find((thread) => thread.id === Number(result.lastInsertRowid))!;
}

export function threadExists(id: number) {
  return Boolean(db.prepare("SELECT id FROM threads WHERE id = ?").get(id));
}

export function incrementThreadVotes(id: number) {
  const result = db.prepare("UPDATE threads SET votes = votes + 1 WHERE id = ?").run(id);
  return result.changes > 0;
}

export function addComment(input: Pick<DbComment, "thread_id" | "author" | "role" | "body">) {
  db.prepare("INSERT INTO comments (thread_id, author, role, body) VALUES (?, ?, ?, ?)")
    .run(input.thread_id, input.author, input.role, input.body);
}

export function verifyComment(threadId: number, commentId: number) {
  const result = db
    .prepare("UPDATE comments SET verified = 1 WHERE id = ? AND thread_id = ?")
    .run(commentId, threadId);
  return result.changes > 0;
}

export function getResourceById(id: number) {
  return db.prepare("SELECT * FROM resources WHERE id = ?").get(id) as DbResource | undefined;
}

export function createResource(input: NewResource): DbResource {
  const result = db
    .prepare(
      `INSERT INTO resources (title, course, session, format, size, uploaded_by, file_name, storage_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.course,
      input.session,
      input.format,
      input.size,
      input.uploaded_by,
      input.file_name,
      input.storage_key,
    );
  return getResourceById(Number(result.lastInsertRowid))!;
}

export async function uploadResourceFile(storageKey: string, contents: Uint8Array, _contentType: string) {
  if (!_contentType) {
    throw new Error("Resource file content type is required.");
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storageKey), contents, { flag: "wx" });
}

export async function removeResourceFile(storageKey: string) {
  await unlink(path.join(UPLOAD_DIR, storageKey));
}

export async function downloadResourceFile(storageKey: string) {
  return readFile(path.join(UPLOAD_DIR, storageKey));
}

export function projectExists(id: number) {
  return Boolean(db.prepare("SELECT id FROM projects WHERE id = ?").get(id));
}

export function addProjectInterest(projectId: number, userId: number) {
  db.prepare("INSERT OR IGNORE INTO project_interests (project_id, user_id) VALUES (?, ?)")
    .run(projectId, userId);
}

export function updateModerationStatus(id: number, status: string) {
  const result = db.prepare("UPDATE moderation_items SET status = ? WHERE id = ?").run(status, id);
  return result.changes > 0;
}
