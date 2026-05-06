REVOKE EXECUTE ON FUNCTION public.sync_tournament_joined_count() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.join_tournament(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_tournament(uuid) TO authenticated;