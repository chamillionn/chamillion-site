"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createPostsClient } from "@/lib/supabase/posts-client";

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

/**
 * Sube un banner al filesystem (public/assets/newsletter/). Pensado para
 * flujo local de drafting: los assets viven en el repo y se commitean con
 * el post. En un entorno prod con filesystem read-only (Vercel), fallará
 * con un error explícito — no es el caso de uso principal.
 */
export async function uploadBannerImage(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const file = formData.get("file");
  const slugRaw = formData.get("slug");
  const slug = typeof slugRaw === "string" ? slugRaw.trim() : "";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "No se adjuntó ningún archivo" };
  }
  if (file.size > MAX_BANNER_BYTES) {
    return { error: `Máximo 8 MB (recibido ${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_IMG_EXT.includes(ext as (typeof ALLOWED_IMG_EXT)[number])) {
    return { error: `Formato no soportado (usa ${ALLOWED_IMG_EXT.join(", ")})` };
  }

  // Nombre: preferir banner-<slug>.<ext>. Si el slug ya existe con otra ext,
  // se sobreescribe la versión con la misma ext (lo típico es que el user
  // suba el banner definitivo del post).
  const safeSlug = /^[a-z0-9][a-z0-9-]*$/.test(slug) ? slug : `${Date.now()}`;
  const filename = `banner-${safeSlug}.${ext}`;
  const publicPath = `/assets/newsletter/${filename}`;
  const absPath = path.join(process.cwd(), "public", "assets", "newsletter", filename);

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, bytes);
  } catch (e) {
    return {
      error: `No se pudo escribir: ${(e as Error).message}. ¿Estás en un entorno con filesystem writable?`,
    };
  }

  return { success: true, path: publicPath, filename };
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
