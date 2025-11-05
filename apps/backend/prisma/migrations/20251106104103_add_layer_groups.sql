-- Manual SQL Migration for Layer Groups
-- This script adds the necessary tables, columns, and constraints to support layer grouping.
-- It is intended to be run manually against your PostgreSQL database.

BEGIN;

-- 1. Create the "layer_groups" table
-- This table will store the groups that layers can belong to within a map.
CREATE TABLE "layer_groups" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layer_groups_pkey" PRIMARY KEY ("id")
);

-- 2. Add the "groupId" column to the "layers" table
-- This column will link a layer to a layer group (optional).
ALTER TABLE "layers" ADD COLUMN "groupId" TEXT;

-- 3. Add foreign key constraint from "layer_groups" to "maps"
-- This ensures that every layer group is associated with a valid map and handles cascading deletes.
ALTER TABLE "layer_groups" ADD CONSTRAINT "layer_groups_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Add foreign key constraint from "layers" to "layer_groups"
-- This links layers to their group. If a group is deleted, the layer's groupId is set to NULL.
ALTER TABLE "layers" ADD CONSTRAINT "layers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "layer_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Create indexes for performance
-- Index on the new foreign key in the "layers" table.
CREATE INDEX "layers_groupId_idx" ON "layers"("groupId");

-- Index on the mapId in the "layer_groups" table for faster lookups.
CREATE INDEX "layer_groups_mapId_idx" ON "layer_groups"("mapId");

-- 6. Create a unique constraint on "layer_groups" for mapId and order
-- This enforces the business rule that the order of groups must be unique within a map.
CREATE UNIQUE INDEX "layer_groups_mapId_order_key" ON "layer_groups"("mapId", "order");

COMMIT;
