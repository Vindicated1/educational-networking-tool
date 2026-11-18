import type {
  DbComment,
  DbResource,
  DbUser,
  ModerationItem,
  NewProject,
  NewResource,
  NewThread,
  NewUser,
  ThreadWithComments,
  UserRole,
} from "@/lib/db-types";

export type { DbUser } from "@/lib/db-types";

type Backend = typeof import("./supabase-db") | typeof import("./sqlite-db");

async function getBackend(): Promise<Backend> {
  if (
    process.env.VERCEL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return import("./supabase-db");
  }
  return import("./sqlite-db");
}

export function serializeUser(user: DbUser) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
  };
}

export async function getUserByEmail(email: string) {
  return (await getBackend()).getUserByEmail(email);
}

export async function getUserById(id: number) {
  return (await getBackend()).getUserById(id);
}

export async function createUser(input: NewUser) {
  return (await getBackend()).createUser(input);
}

export async function getThreads(): Promise<ThreadWithComments[]> {
  return (await getBackend()).getThreads();
}

export async function createThread(input: NewThread) {
  return (await getBackend()).createThread(input);
}

export async function threadExists(id: number) {
  return (await getBackend()).threadExists(id);
}

export async function incrementThreadVotes(id: number) {
  return (await getBackend()).incrementThreadVotes(id);
}

export async function addComment(input: Pick<DbComment, "thread_id" | "author" | "role" | "body">) {
  return (await getBackend()).addComment(input);
}

export async function verifyComment(threadId: number, commentId: number) {
  return (await getBackend()).verifyComment(threadId, commentId);
}

export async function getResources(): Promise<DbResource[]> {
  return (await getBackend()).getResources();
}

export async function getResourceById(id: number) {
  return (await getBackend()).getResourceById(id);
}

export async function createResource(input: NewResource) {
  return (await getBackend()).createResource(input);
}

export async function uploadResourceFile(storageKey: string, contents: Uint8Array, contentType: string) {
  return (await getBackend()).uploadResourceFile(storageKey, contents, contentType);
}

export async function removeResourceFile(storageKey: string) {
  return (await getBackend()).removeResourceFile(storageKey);
}

export async function downloadResourceFile(storageKey: string) {
  return (await getBackend()).downloadResourceFile(storageKey);
}

export async function getProjects() {
  return (await getBackend()).getProjects();
}

export async function createProject(input: NewProject) {
  return (await getBackend()).createProject(input);
}

export async function projectExists(id: number) {
  return (await getBackend()).projectExists(id);
}

export async function addProjectInterest(projectId: number, userId: number) {
  return (await getBackend()).addProjectInterest(projectId, userId);
}

export async function getModerationQueue(): Promise<ModerationItem[]> {
  return (await getBackend()).getModerationQueue();
}

export async function updateModerationStatus(id: number, status: string) {
  return (await getBackend()).updateModerationStatus(id, status);
}

export type { UserRole };
