-- Draft content columns for the in-app newsletter editor.
-- Posts are still published as hardcoded TSX; these columns only hold the
-- working draft so the editor can round-trip state and expose readable MD.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_json jsonb,
  ADD COLUMN IF NOT EXISTS content_md   text,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz;

COMMENT ON COLUMN posts.content_json IS 'TipTap ProseMirror doc (editor state).';
COMMENT ON COLUMN posts.content_md   IS 'Markdown export of the draft for reference.';
COMMENT ON COLUMN posts.draft_updated_at IS 'Last autosave timestamp for the draft editor.';
