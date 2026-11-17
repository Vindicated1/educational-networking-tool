import { courseOptions, defaultCourse } from "@/lib/courses";

export type Role = "Student" | "Faculty" | "Admin";
export type Tab = "Forum" | "Resources" | "Projects" | "Admin";

export type ThreadComment = {
  id: number;
  author: string;
  role: Role;
  body: string;
  verified?: boolean;
};

export type Thread = {
  id: number;
  title: string;
  course: string;
  category: "Discussion" | "Question";
  author: string;
  body: string;
  votes: number;
  comments: ThreadComment[];
};

export type Resource = {
  id: number;
  title: string;
  course: string;
  session: string;
  format: "PDF" | "DOCX";
  size: string;
  uploadedBy: string;
  fileName?: string;
};

export type Project = {
  id: number;
  title: string;
  summary: string;
  requiredSkills: string[];
  owner: string;
  match: number;
};

export const defaultThreads: Thread[] = [
  {
    id: 1,
    title: "How do I choose a research methodology for my project?",
    course: defaultCourse,
    category: "Question",
    author: "Aisha M.",
    body:
      "I am planning a research project and need help choosing an appropriate methodology. What factors should I consider?",
    votes: 42,
    comments: [
      {
        id: 11,
        author: "Prof. Okafor",
        role: "Faculty",
        body:
          "Start with your research question, then compare suitable qualitative, quantitative, or mixed-method approaches.",
        verified: true,
      },
      {
        id: 12,
        author: "Daniel A.",
        role: "Student",
        body: "I compared the methods against my research question and the kind of evidence I needed to collect.",
      },
    ],
  },
  {
    id: 2,
    title: "UI student team looking for a designer for campus event app",
    course: "General",
    category: "Discussion",
    author: "Samuel T.",
    body:
      "We are building an event discovery app for students and need help with UX flows and mockups before next sprint.",
    votes: 18,
    comments: [
      {
        id: 21,
        author: "Grace O.",
        role: "Student",
        body: "I can help with mobile wireframes and user flow diagrams.",
      },
    ],
  },
];

export const defaultResources: Resource[] = [
  {
    id: 1,
    title: "CSC476 Research Methodology Lecture Notes",
    course: defaultCourse,
    session: "2026/2027",
    format: "PDF",
    size: "2.4 MB",
    uploadedBy: "Faculty",
  },
  {
    id: 2,
    title: "CSC302 System Analysis and Design Practice Questions",
    course: courseOptions[1],
    session: "2025/2026",
    format: "DOCX",
    size: "680 KB",
    uploadedBy: "Student",
  },
  {
    id: 3,
    title: "Project Proposal Template",
    course: "General",
    session: "2026/2027",
    format: "DOCX",
    size: "1.1 MB",
    uploadedBy: "Faculty",
  },
];

export const defaultProjects: Project[] = [
  {
    id: 1,
    title: "Campus Study Buddy Matching",
    summary: "A system for pairing students with peer tutors across departments.",
    requiredSkills: ["Python", "UI/UX", "Research"],
    owner: "Mariam",
    match: 92,
  },
  {
    id: 2,
    title: "Smart Library Queue Tracker",
    summary: "Improve seat and desk availability tracking for faculty and students.",
    requiredSkills: ["React", "Data Analysis", "Product Design"],
    owner: "Kingsley",
    match: 71,
  },
  {
    id: 3,
    title: "Faculty Office Hours Planner",
    summary: "Help students schedule meetings and view faculty availability.",
    requiredSkills: ["UX Research", "Next.js", "API Design"],
    owner: "Bola",
    match: 64,
  },
];

export const adminAlerts = [
  "2 course threads flagged for moderation.",
  "3 student accounts pending verification.",
  "Cloudinary storage health is stable at 98.1%.",
];

export function getRoleFromEmail(email: string): Role {
  const lower = email.toLowerCase();
  if (lower.endsWith("@stu.ui.edu.ng") || lower.endsWith("@dlc.ui.edu.ng")) return "Student";
  if (lower.endsWith("@ui.edu.ng")) return "Faculty";
  return "Student";
}

export function calculateMatchScore(userSkills: string[], projectSkills: string[]) {
  const normalizedUser = userSkills.map((skill) => skill.toLowerCase());
  const normalizedProject = projectSkills.map((skill) => skill.toLowerCase());
  const intersection = new Set(
    normalizedUser.filter((skill) => normalizedProject.includes(skill)),
  );
  const denominator = Math.max(normalizedProject.length, 1);
  return Math.min(100, Math.round((intersection.size / denominator) * 100));
}
