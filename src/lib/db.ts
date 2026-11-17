import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "@/lib/auth";
import { courseOptions, defaultCourse } from "@/lib/courses";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "education-network.db");

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

export type DbUser = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: "Student" | "Faculty" | "Admin";
};

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

export function getThreads() {
  const rows = db.prepare("SELECT * FROM threads ORDER BY created_at DESC").all() as Array<{
    id: number;
    title: string;
    course: string;
    category: string;
    author: string;
    body: string;
    votes: number;
  }>;

  return rows.map((thread) => {
    const comments = db
      .prepare(
        `SELECT * FROM comments WHERE thread_id = ? ORDER BY id ASC`
      )
      .all(thread.id) as Array<{
        id: number;
        author: string;
        role: string;
        body: string;
        verified: number;
      }>;

    return {
      id: thread.id,
      title: thread.title,
      course: thread.course,
      category: thread.category,
      author: thread.author,
      body: thread.body,
      votes: thread.votes,
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

export function getResources() {
  return db.prepare("SELECT * FROM resources ORDER BY created_at DESC").all() as Array<{
    id: number;
    title: string;
    course: string;
    session: string;
    format: string;
    size: string;
    uploaded_by: string;
  }>;
}

export function getProjects() {
  return db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all() as Array<{
    id: number;
    title: string;
    summary: string;
    required_skills: string;
    owner: string;
    match: number;
  }>;
}

export function getModerationQueue() {
  return db.prepare("SELECT id, type, title, owner, urgency, status FROM moderation_items ORDER BY id ASC").all() as Array<{
    id: number;
    type: string;
    title: string;
    owner: string;
    urgency: string;
    status: string;
  }>;
}
