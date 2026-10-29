export type Sport = {
  id: number;
  slug: string;
  name: string;
  category: string;
  hard_max: number | null;
  icon: string;
  drill_name: string;
  drill_instructions: string;
  camera_tips: string;
  metric_label: string;
  metric_unit: string;
  higher_is_better: boolean;
  max_clip_seconds: number;
};

export type Profile = {
  id: string;
  role: "player" | "scout";
  full_name: string;
  age: number | null;
  gender: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  school_or_club: string | null;
  preferred_language: string;
  parent_consent: boolean;
  verified_scout: boolean;
};

export type Submission = {
  id: string;
  player_id: string;
  sport_id: number;
  video_path: string;
  notes: string | null;
  status: "pending" | "scored" | "rejected";
  metric_value: number | null;
  reported_value: number | null;
  score: number | null;
  created_at: string;
  sports?: Pick<Sport, "name" | "slug" | "metric_label" | "metric_unit"> | null;
  profiles?: Pick<Profile, "full_name" | "age" | "village" | "district" | "state"> | null;
};
