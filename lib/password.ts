/** Medium password: at least 8 characters, one letter and one number. */
export function passwordChecks(pw: string) {
  return [
    { ok: pw.length >= 8, text: "At least 8 characters" },
    { ok: /[A-Za-z]/.test(pw), text: "At least one letter" },
    { ok: /\d/.test(pw), text: "At least one number" },
  ];
}
