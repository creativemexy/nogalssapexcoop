-- Make parentOrganizationId required for cooperatives
-- All cooperatives have been associated with parent organizations via script
-- This migration makes the column NOT NULL

ALTER TABLE "cooperatives" 
ALTER COLUMN "parentOrganizationId" SET NOT NULL;
