-- Per-schema revokes cannot remove the global PUBLIC default for functions.
alter default privileges for role postgres revoke execute on functions from public, anon, authenticated;
