-- Add section column to posts
-- Sections: 'Reporte de la Cartera', 'Deep Dives'
ALTER TABLE posts ADD COLUMN IF NOT EXISTS section text;

-- Tag existing posts
UPDATE posts SET section = 'Reporte de la Cartera'
WHERE slug = 'como-decir-adios-a-tu-banco';
