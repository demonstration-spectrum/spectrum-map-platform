-- Manually created migration to add the VIEWER role to the UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';
