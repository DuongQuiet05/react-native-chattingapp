-- Migration script to add is_blocked column to users table
-- Run this script manually if Hibernate auto-update doesn't work

-- Add column (will fail if column already exists, that's OK)
ALTER TABLE users 
ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Note: If you get "Duplicate column name" error, the column already exists and you can ignore it

