-- Influence and future custom question types: widen type column (was VARCHAR(16)).
-- Safe to run on existing DBs; values like 'slider', 'multi', 'influence', 'text' stay valid.

ALTER TABLE questions MODIFY COLUMN type VARCHAR(32) NOT NULL;
