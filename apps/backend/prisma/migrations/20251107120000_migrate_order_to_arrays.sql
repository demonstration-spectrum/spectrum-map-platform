-- Manual migration: populate new array order columns from existing numeric `order` columns
-- Run this manually after deploying the Prisma schema change that added
-- "maps"."rootOrder" (text[]) and "layer_groups"."layerOrder" (text[]).
-- This script is intentionally non-destructive: it does not drop the old
-- numeric `order` columns. Verify results before removing legacy columns.

BEGIN;

-- 1) Create columns if they do not already exist (safe to run multiple times)
ALTER TABLE "maps" ADD COLUMN IF NOT EXISTS "rootOrder" text[] DEFAULT ARRAY[]::text[];
ALTER TABLE "layer_groups" ADD COLUMN IF NOT EXISTS "layerOrder" text[] DEFAULT ARRAY[]::text[];

-- 2) Populate layer_group.layerOrder from layers that belong to that group.
--    We order by the existing numeric "order" descending so the array is top-first
--    (matches the editor UI where higher `order` means on-top).
UPDATE "layer_groups" lg
SET "layerOrder" = COALESCE(
  (
    SELECT array_agg(l.id ORDER BY l."order" DESC)
    FROM "layers" l
    WHERE l."groupId" = lg.id
  ), ARRAY[]::text[]
)
WHERE (
  SELECT count(*) FROM "layers" l WHERE l."groupId" = lg.id
) > 0;

-- 3) Populate maps.rootOrder from ungrouped layers (layers with groupId IS NULL)
--    Order by numeric "order" descending so array is top-first.
UPDATE "maps" m
SET "rootOrder" = COALESCE(
  (
    SELECT array_agg(l.id ORDER BY l."order" DESC)
    FROM "layers" l
    WHERE l."mapId" = m.id AND l."groupId" IS NULL
  ), ARRAY[]::text[]
)
WHERE (
  SELECT count(*) FROM "layers" l WHERE l."mapId" = m.id AND l."groupId" IS NULL
) > 0;

-- 4) Sanity checks (these SELECTs are informational; remove when happy)
--   - Count groups that now have non-empty layerOrder
--   - Count maps that now have non-empty rootOrder
--   - Example rows (limit 5)

-- SELECT count(*) AS groups_with_layerOrder FROM "layer_groups" WHERE cardinality("layerOrder") > 0;
-- SELECT count(*) AS maps_with_rootOrder FROM "maps" WHERE cardinality("rootOrder") > 0;
-- SELECT id, "layerOrder" FROM "layer_groups" WHERE cardinality("layerOrder") > 0 LIMIT 5;
-- SELECT id, "rootOrder" FROM "maps" WHERE cardinality("rootOrder") > 0 LIMIT 5;

COMMIT;
