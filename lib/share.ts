import { SITE_URL } from "./federation";

/** WhatsApp click-to-chat link carrying the proof link. */
export function whatsappUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
export const proofUrl = (token: string) => `${SITE_URL}/verify/${token}`;
