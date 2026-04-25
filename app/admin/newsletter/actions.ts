"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createPostsClient } from "@/lib/supabase/posts-client";
import type { EditorState } from "@/lib/supabase/types";

export async function togglePostPremium(id: string, premium: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const postsDb = createPostsClient();
  const { error } = await postsDb
    .from("posts")
    .update({ premium })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  return { success: true };
}

export async function togglePostPublished(id: string, published: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const postsDb = createPostsClient();
  const { error } = await postsDb
    .from("posts")
    .update({ published })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  return { success: true };
}

export interface DraftMetadata {
  title?: string;
  subtitle?: string | null;
  slug?: string;
  section?: string | null;
  banner_path?: string | null;
  banner_aspect?: string | null;
  substack_url?: string | null;
  premium?: boolean;
  date?: string;
}

export async function createDraftPost(input: { title: string; slug: string }) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title) return { error: "Título requerido" };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return { error: "Slug inválido (minúsculas, números y guiones)" };
  }

  const postsDb = createPostsClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await postsDb
    .from("posts")
    .insert({ title, slug, date: today, published: false, premium: false })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/newsletter");
  return { success: true, id: data.id };
}

export async function saveDraftContent(
  id: string,
  content: { contentJson: unknown; contentMd: string },
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const postsDb = createPostsClient();
  const { error } = await postsDb
    .from("posts")
    .update({
      content_json: content.contentJson,
      content_md: content.contentMd,
      draft_updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true, savedAt: new Date().toISOString() };
}

/**
 * Merge parcial en la columna jsonb `editor_state`. Para settings del
 * editor que no son contenido (añade campos en `EditorState` en types.ts).
 * Uso típico:
 *   updateEditorState(post.id, { focusMode: true })
 */
export async function updateEditorState(
  id: string,
  patch: Partial<EditorState>,
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const postsDb = createPostsClient();

  // Fetch-merge-write. Suficiente para 1 usuario admin sin concurrencia.
  // Si alguna vez se vuelve concurrente, se puede mover a un SQL function
  // con `editor_state = editor_state || $1` atómico.
  const { data: current, error: readErr } = await postsDb
    .from("posts")
    .select("editor_state")
    .eq("id", id)
    .single();
  if (readErr) return { error: readErr.message };

  const next: EditorState = {
    ...((current?.editor_state as EditorState | null) ?? {}),
    ...patch,
  };

  const { error } = await postsDb
    .from("posts")
    .update({ editor_state: next })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateDraftMetadata(id: string, patch: DraftMetadata) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  if (patch.slug && !/^[a-z0-9][a-z0-9-]*$/.test(patch.slug)) {
    return { error: "Slug inválido" };
  }

  const postsDb = createPostsClient();
  const { error } = await postsDb.from("posts").update(patch).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/newsletter");
  return { success: true };
}

const ALLOWED_IMG_EXT = ["jpg", "jpeg", "png", "webp", "avif"] as const;
const MAX_BANNER_BYTES = 8 * 1024 * 1024; // 8 MB

interface ValidatedUpload {
  file: Blob & { name?: string; type?: string };
  ext: string;
}

function validateUpload(formData: FormData): { error: string } | ValidatedUpload {
  const entry = formData.get("file");
  if (!entry || typeof entry === "string") {
    return { error: "No se adjuntó ningún archivo" };
  }
  const file = entry as Blob & { name?: string; type?: string };
  if (file.size === 0) return { error: "No se adjuntó ningún archivo" };
  if (file.size > MAX_BANNER_BYTES) {
    return {
      error: `Máximo 8 MB (recibido ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }
  const originalName = typeof file.name === "string" ? file.name : "";
  let ext = (originalName.split(".").pop() ?? "").toLowerCase();
  if (!ext && file.type) {
    ext = file.type.split("/").pop()?.toLowerCase() ?? "";
  }
  if (!ALLOWED_IMG_EXT.includes(ext as (typeof ALLOWED_IMG_EXT)[number])) {
    return {
      error: `Formato no soportado (usa ${ALLOWED_IMG_EXT.join(", ")})`,
    };
  }
  return { file, ext };
}

/**
 * Sube un banner a Vercel Blob (carpeta `newsletter/`). El path devuelto
 * es la URL pública absoluta del Blob, que se persiste tal cual en
 * `posts.banner_path` y se sirve directo desde el CDN de Vercel.
 *
 * Requiere `BLOB_READ_WRITE_TOKEN` en el entorno (Vercel lo inyecta
 * automáticamente; en local hay que añadirlo en `.env.local`).
 */
export async function uploadBannerImage(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const validated = validateUpload(formData);
  if ("error" in validated) return validated;
  const { file, ext } = validated;

  const slugRaw = formData.get("slug");
  const slug = typeof slugRaw === "string" ? slugRaw.trim() : "";
  // Si el slug es válido, usamos un nombre estable (banner-<slug>.<ext>)
  // y dejamos que Vercel Blob añada un sufijo aleatorio para evitar
  // colisiones entre versiones del mismo post.
  const safeSlug = /^[a-z0-9][a-z0-9-]*$/.test(slug) ? slug : `${Date.now()}`;
  const pathname = `newsletter/banner-${safeSlug}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
      addRandomSuffix: true,
    });
    return { success: true, path: blob.url, filename: blob.pathname };
  } catch (e) {
    return {
      error: `No se pudo subir a Vercel Blob: ${(e as Error).message}. Comprueba que BLOB_READ_WRITE_TOKEN esté configurado.`,
    };
  }
}

/**
 * Sube una imagen inline (no banner) a Vercel Blob. Devuelve la URL
 * pública del Blob para insertarla en el contenido del post.
 */
export async function uploadInlineImage(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const validated = validateUpload(formData);
  if ("error" in validated) return validated;
  const { file, ext } = validated;

  const slugRaw = formData.get("slug");
  const slug = typeof slugRaw === "string" ? slugRaw.trim() : "";
  const safeSlug = /^[a-z0-9][a-z0-9-]*$/.test(slug) ? slug : "img";
  const pathname = `newsletter/${safeSlug}-${Date.now()}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
      addRandomSuffix: true,
    });
    return { success: true, path: blob.url, filename: blob.pathname };
  } catch (e) {
    return {
      error: `No se pudo subir a Vercel Blob: ${(e as Error).message}`,
    };
  }
}

export async function deleteDraftPost(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const postsDb = createPostsClient();
  const { data: post } = await postsDb
    .from("posts")
    .select("published")
    .eq("id", id)
    .single();
  if (post?.published) {
    return { error: "No se puede borrar un post publicado" };
  }

  const { error } = await postsDb.from("posts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/newsletter");
  return { success: true };
}
