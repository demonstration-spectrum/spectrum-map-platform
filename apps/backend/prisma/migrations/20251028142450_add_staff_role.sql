-- Manually created migration to add the STAFF role to the UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'STAFF';
