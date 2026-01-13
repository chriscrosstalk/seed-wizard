-- Add favorite and planted status columns to seeds table
ALTER TABLE seeds ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE seeds ADD COLUMN is_planted BOOLEAN DEFAULT FALSE;

-- Add indexes for filtering (commonly queried)
CREATE INDEX idx_seeds_is_favorite ON seeds(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_seeds_is_planted ON seeds(is_planted) WHERE is_planted = TRUE;
