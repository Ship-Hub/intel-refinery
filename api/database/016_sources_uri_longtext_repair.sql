-- Allow pasted browser/search result URLs to exceed the original 1000 char cap.
-- Source URLs are not indexed, so TEXT is safe here and prevents validation/DB drift.

ALTER TABLE sources
  MODIFY COLUMN uri TEXT NULL;
