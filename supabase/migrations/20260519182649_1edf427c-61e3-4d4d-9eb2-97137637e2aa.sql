
CREATE TABLE public.leaderboard_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_position integer NOT NULL UNIQUE,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can view rewards"
ON public.leaderboard_rewards FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage rewards"
ON public.leaderboard_rewards FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leaderboard_rewards_updated_at
BEFORE UPDATE ON public.leaderboard_rewards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.leaderboard_rewards (rank_position, coins) VALUES
  (1, 1000), (2, 500), (3, 250)
ON CONFLICT (rank_position) DO NOTHING;
