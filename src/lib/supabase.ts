import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  DbComment,
  DbProject,
  DbResource,
  DbThread,
  DbUser,
  ModerationItem,
} from "@/lib/db-types";

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationship[];
};

export type Database = {
  public: {
    Tables: {
      users: Table<DbUser, Omit<DbUser, "id" | "created_at"> & { id?: number; created_at?: string }>;
      threads: Table<DbThread, Omit<DbThread, "id" | "created_at" | "votes"> & { id?: number; created_at?: string; votes?: number }>;
      comments: Table<DbComment, Omit<DbComment, "id" | "created_at" | "verified"> & { id?: number; created_at?: string; verified?: boolean }>;
      resources: Table<DbResource, Omit<DbResource, "id" | "created_at"> & { id?: number; created_at?: string }>;
      projects: Table<DbProject, Omit<DbProject, "id" | "created_at" | "match"> & { id?: number; created_at?: string; match?: number }>;
      project_interests: Table<
        { id: number; project_id: number; user_id: number; created_at: string },
        { id?: number; project_id: number; user_id: number; created_at?: string }
      >;
      moderation_items: Table<ModerationItem & { created_at: string }, Omit<ModerationItem, "id"> & { id?: number; created_at?: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      increment_thread_votes: {
        Args: { p_thread_id: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!client) {
    client = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return client;
}
