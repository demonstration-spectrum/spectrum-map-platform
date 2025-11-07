-- Drop the legacy 'order' column from the 'layers' table
ALTER TABLE "layers" DROP COLUMN IF EXISTS "order";

-- Drop the legacy 'order' column from the 'layer_groups' table
ALTER TABLE "layer_groups" DROP COLUMN IF EXISTS "order";
