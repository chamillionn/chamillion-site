-- Add substack_url column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS substack_url text;

-- Set URLs for existing posts
UPDATE posts SET substack_url = 'https://chamillion.substack.com/p/navegar-las-finanzas-modernas'
WHERE slug = 'navegar-las-finanzas-modernas-el-augurio-de-una-odisea';

UPDATE posts SET substack_url = 'https://chamillion.substack.com/p/como-decir-adios-a-tu-banco'
WHERE slug = 'como-decir-adios-a-tu-banco';
