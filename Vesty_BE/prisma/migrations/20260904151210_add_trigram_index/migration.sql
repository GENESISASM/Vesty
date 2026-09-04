-- This is an empty migration.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS finances_description_trgm_idx ON "finances" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS finances_category_trgm_idx ON "finances" USING GIN ("category" gin_trgm_ops);