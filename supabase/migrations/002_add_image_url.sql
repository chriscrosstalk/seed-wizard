-- Add image_url column to seeds table for product thumbnails
ALTER TABLE seeds ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN seeds.image_url IS 'URL to product image from seed company website';
