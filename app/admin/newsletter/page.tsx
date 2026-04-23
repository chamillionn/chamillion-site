import { requireAdmin } from "@/lib/supabase/admin";
import { createPostsClient } from "@/lib/supabase/posts-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Post } from "@/lib/supabase/types";
import NewsletterTable from "./newsletter-table";
import styles from "../crud.module.css";

export const metadata = { title: "Admin — Newsletter" };

export default async function AdminNewsletter() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const postsDb = createPostsClient();
  const { data } = await postsDb
    .from("posts")
    .select("*")
    .order("date", { ascending: false });

  const posts = (data ?? []) as Post[];

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <h1 className={styles.heading} style={{ marginBottom: 0 }}>
          Newsletter
        </h1>
        <Link href="/editor/nuevo" className={styles.btnPrimary}>
          + Nuevo borrador
        </Link>
      </div>
      <NewsletterTable posts={posts} />
    </>
  );
}
