-- Idempotent conversation message ingestion (run manually against your MySQL schema).
-- Requires no duplicate (conversation_id, external_message_id) rows before applying.

ALTER TABLE conversation_messages
  ADD UNIQUE INDEX uniq_conversation_external_message (
    conversation_id,
    external_message_id
  );
