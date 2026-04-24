-- Columna catch-all para settings del editor de borradores que NO son
-- contenido ni metadata publicable del post. Crece sin migraciones: cualquier
-- setting nuevo del editor se añade a la interface EditorState en TS y vive
-- aquí.
--
-- Regla:
--   - Contenido del post (título, banner_path, banner_aspect, content_json,
--     content_md, premium, published, section) → columnas propias.
--   - Settings del editor per-post (cómo lo ves al drafting, toggles UI del
--     admin) → editor_state.
--   - Preferencias de UI per-device (sidebar open, tema) → localStorage.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS editor_state jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN posts.editor_state IS
  'Settings per-post del editor de borradores. Crece sin migraciones — mirror de TS interface EditorState.';
