import "server-only";

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
import { getSupabaseClient } from "@/lib/supabase";

export async function getUserByEmail(email: string) {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserById(id: number) {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser(input: NewUser): Promise<DbUser> {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getThreads(): Promise<ThreadWithComments[]> {
  const supabase = getSupabaseClient();
  const [{ data: threads, error: threadsError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase.from("threads").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("*").order("id", { ascending: true }),
    ]);

  if (threadsError) throw threadsError;
  if (commentsError) throw commentsError;

  return threads.map((thread: DbThread) => ({
    ...thread,
    comments: comments
      .filter((comment: DbComment) => comment.thread_id === thread.id)
      .map(({ id, author, role, body, verified }: DbComment) => ({
        id,
        author,
        role,
        body,
        verified,
      })),
  }));
}

export async function createThread(input: NewThread): Promise<ThreadWithComments> {
  const { data, error } = await getSupabaseClient()
    .from("threads")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, comments: [] };
}

export async function threadExists(id: number) {
  const { data, error } = await getSupabaseClient()
    .from("threads")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function incrementThreadVotes(id: number) {
  const { error } = await getSupabaseClient().rpc("increment_thread_votes", { p_thread_id: id });
  if (error) throw error;
}

export async function addComment(input: Pick<DbComment, "thread_id" | "author" | "role" | "body">) {
  const { error } = await getSupabaseClient().from("comments").insert(input);
  if (error) throw error;
}

export async function verifyComment(threadId: number, commentId: number) {
  const { data, error } = await getSupabaseClient()
    .from("comments")
    .update({ verified: true })
    .eq("id", commentId)
    .eq("thread_id", threadId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getResources(): Promise<DbResource[]> {
  const { data, error } = await getSupabaseClient()
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getResourceById(id: number) {
  const { data, error } = await getSupabaseClient()
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createResource(input: NewResource): Promise<DbResource> {
  const { data, error } = await getSupabaseClient()
    .from("resources")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function uploadResourceFile(storageKey: string, contents: Uint8Array, contentType: string) {
  const { error } = await getSupabaseClient()
    .storage
    .from("resources")
    .upload(storageKey, Buffer.from(contents), { contentType, upsert: false });
  if (error) throw error;
}

export async function removeResourceFile(storageKey: string) {
  const { error } = await getSupabaseClient().storage.from("resources").remove([storageKey]);
  if (error) throw error;
}

export async function downloadResourceFile(storageKey: string) {
  const { data, error } = await getSupabaseClient().storage.from("resources").download(storageKey);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function getProjects(): Promise<DbProject[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProject(input: NewProject): Promise<DbProject> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .insert({ ...input, match: 0 })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function projectExists(id: number) {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function addProjectInterest(projectId: number, userId: number) {
  const { error } = await getSupabaseClient()
    .from("project_interests")
    .upsert({ project_id: projectId, user_id: userId }, {
      onConflict: "project_id,user_id",
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

export async function getModerationQueue(): Promise<ModerationItem[]> {
  const { data, error } = await getSupabaseClient()
    .from("moderation_items")
    .select("id, type, title, owner, urgency, status")
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateModerationStatus(id: number, status: string) {
  const { data, error } = await getSupabaseClient()
    .from("moderation_items")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
