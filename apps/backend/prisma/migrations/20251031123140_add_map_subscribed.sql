-- Step 1: Add the new value to the existing enum.
ALTER TYPE "MapVisibility" ADD VALUE 'SUBSCRIBED';

-- Step 2: Update the "maps" table to set a default value for existing rows.
UPDATE "maps" SET "visibility" = 'SUBSCRIBED' WHERE "visibility" IS NULL;

-- Step 3: Alter the column to set the default value for new rows.
ALTER TABLE "maps" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE';