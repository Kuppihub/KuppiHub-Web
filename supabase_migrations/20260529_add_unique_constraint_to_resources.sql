-- Migration: Add unique constraint on storage_provider and storage_key to allow conflict upserts.

ALTER TABLE public.resources
ADD CONSTRAINT unique_storage_provider_key UNIQUE (storage_provider, storage_key);
