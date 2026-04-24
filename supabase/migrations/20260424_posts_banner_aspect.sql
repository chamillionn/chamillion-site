-- Permite personalizar el aspect-ratio del banner del post.
-- Null = default del editor / post.module.css (3 / 1).
-- Valores típicos: "4 / 1", "3 / 1", "2 / 1", "16 / 9".

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS banner_aspect text;

COMMENT ON COLUMN posts.banner_aspect IS
  'CSS aspect-ratio del banner (ej. "3 / 1"). Null hereda el default 3/1.';
