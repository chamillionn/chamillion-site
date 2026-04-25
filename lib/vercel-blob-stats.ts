import { list } from "@vercel/blob";

export interface BlobStats {
  available: boolean;
  count: number;
  totalBytes: number;
  freeTierBytes: number;
  usedPct: number;
  largest: { pathname: string; size: number; uploadedAt: string }[];
}

const FREE_TIER_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB Hobby tier (storage)

/**
 * Lista todos los blobs y agrega su tamaño. Pagina hasta agotar.
 * Devuelve `available: false` si falta el token (entornos locales sin
 * Vercel Blob configurado).
 */
export async function getBlobStats(): Promise<BlobStats> {
  const empty: BlobStats = {
    available: false,
    count: 0,
    totalBytes: 0,
    freeTierBytes: FREE_TIER_BYTES,
    usedPct: 0,
    largest: [],
  };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return empty;

  let cursor: string | undefined;
  let count = 0;
  let totalBytes = 0;
  const all: { pathname: string; size: number; uploadedAt: string }[] = [];
  try {
    do {
      const res = await list({ cursor, limit: 1000 });
      for (const b of res.blobs) {
        count++;
        totalBytes += b.size;
        all.push({
          pathname: b.pathname,
          size: b.size,
          uploadedAt:
            b.uploadedAt instanceof Date
              ? b.uploadedAt.toISOString()
              : String(b.uploadedAt),
        });
      }
      cursor = res.hasMore ? res.cursor : undefined;
    } while (cursor);
  } catch {
    return empty;
  }

  const largest = all.sort((a, b) => b.size - a.size).slice(0, 5);
  return {
    available: true,
    count,
    totalBytes,
    freeTierBytes: FREE_TIER_BYTES,
    usedPct: (totalBytes / FREE_TIER_BYTES) * 100,
    largest,
  };
}
