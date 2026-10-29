/**
 * Team members shown at the bottom of the About page.
 * Add one object per member. Leave a field out (or empty) and its link is not shown.
 * Use only the handle, not the full URL: instagram "name", linkedin "name-123", github "name".
 */
export type Member = {
  name: string;
  role: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
};

export const TEAM: Member[] = [
  { name: "Muhammad Sabith Ismail", role: "Team member", github: "sabithismail" },
  // { name: "Member name", role: "What they built", instagram: "handle", linkedin: "handle", github: "handle" },
];
