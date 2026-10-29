import type { Lang } from "./i18n";

type T = Record<Lang, string>;

/** Extra UI strings (navigation, intro, captions). Merged into the main dictionary. */
export const extra: Record<string, T> = {
  docs: { en: "Docs", hi: "दस्तावेज़", kn: "ದಾಖಲೆ" },
  architecture: { en: "Architecture", hi: "संरचना", kn: "ರಚನೆ" },
  splashSub: { en: "Every village has a champion", hi: "हर गाँव में एक चैंपियन है", kn: "ಪ್ರತಿ ಹಳ್ಳಿಯಲ್ಲೂ ಒಬ್ಬ ಚಾಂಪಿಯನ್ ಇದ್ದಾನೆ" },
  clearSearch: { en: "Clear search", hi: "खोज साफ़ करें", kn: "ಹುಡುಕಾಟ ಅಳಿಸಿ" },
  watchVideo: { en: "Watch video", hi: "वीडियो देखें", kn: "ವೀಡಿಯೊ ನೋಡಿ" },
  languageLabel: { en: "Language", hi: "भाषा", kn: "ಭಾಷೆ" },
  prevPhoto: { en: "Previous photo", hi: "पिछली फ़ोटो", kn: "ಹಿಂದಿನ ಫೋಟೋ" },
  nextPhoto: { en: "Next photo", hi: "अगली फ़ोटो", kn: "ಮುಂದಿನ ಫೋಟೋ" },
  photosRegion: { en: "Rural sports photos", hi: "ग्रामीण खेलों की फ़ोटो", kn: "ಗ್ರಾಮೀಣ ಕ್ರೀಡೆಗಳ ಫೋಟೋಗಳು" },
  photoN: { en: "Photo", hi: "फ़ोटो", kn: "ಫೋಟೋ" },
  cap1: { en: "Kabaddi on a village ground", hi: "गाँव के मैदान पर कबड्डी", kn: "ಹಳ್ಳಿಯ ಮೈದಾನದಲ್ಲಿ ಕಬಡ್ಡಿ" },
  cap2: { en: "Kho-kho practice", hi: "खो-खो का अभ्यास", kn: "ಖೋ-ಖೋ ಅಭ್ಯಾಸ" },
  cap3: { en: "A game after the monsoon rain", hi: "मानसून की बारिश के बाद एक खेल", kn: "ಮಳೆಯ ನಂತರ ಒಂದು ಆಟ" },
  cap4: { en: "Football with a bamboo goalpost", hi: "बाँस के गोलपोस्ट वाला फ़ुटबॉल", kn: "ಬಿದಿರಿನ ಗೋಲ್‌ಪೋಸ್ಟ್‌ನ ಫುಟ್ಬಾಲ್" },
  cap5: { en: "Volleyball at golden hour", hi: "सुनहरी शाम में वॉलीबॉल", kn: "ಸುವರ್ಣ ಸಂಜೆಯಲ್ಲಿ ವಾಲಿಬಾಲ್" },
  cap6: { en: "Evening run on the court", hi: "मैदान पर शाम की दौड़", kn: "ಅಂಗಳದಲ್ಲಿ ಸಂಜೆಯ ಓಟ" },
};

export const categories: Record<string, T> = {
  "Athletics": { en: "Athletics", hi: "एथलेटिक्स", kn: "ಅಥ್ಲೆಟಿಕ್ಸ್" },
  "Team Sports": { en: "Team Sports", hi: "टीम खेल", kn: "ತಂಡ ಕ್ರೀಡೆಗಳು" },
  "Racquet Sports": { en: "Racquet Sports", hi: "रैकेट खेल", kn: "ರಾಕೆಟ್ ಕ್ರೀಡೆಗಳು" },
  "Combat & Strength": { en: "Combat & Strength", hi: "युद्ध कला और शक्ति", kn: "ಕಾಳಗ ಮತ್ತು ಶಕ್ತಿ" },
  "Skill & Endurance": { en: "Skill & Endurance", hi: "कौशल और सहनशक्ति", kn: "ಕೌಶಲ ಮತ್ತು ಸಹನೆ" },
};

const s = (en: string, hi: string, kn: string): T => ({ en, hi, kn });
export const sportNamesExtra: Record<string, T> = {
  "vertical-jump": s("Vertical Jump", "वर्टिकल जंप", "ವರ್ಟಿಕಲ್ ಜಂಪ"),
  "discus-throw": s("Discus Throw", "चक्का फेंक", "ಚಕ್ರ ಎಸೆತ"),
  "high-jump": s("High Jump", "ऊँची कूद", "ಎತ್ತರ ಜಿಗಿತ"),
  "long-distance": s("Long Distance Run", "लंबी दूरी की दौड़", "ದೀರ್ಘ ಅಂತರದ ಓಟ"),
  "middle-distance": s("Middle Distance Run", "मध्यम दूरी की दौड़", "ಮಧ್ಯಮ ಅಂತರದ ಓಟ"),
  "shot-put": s("Shot Put", "गोला फेंक", "ಗುಂಡು ಎಸೆತ"),
  "shuttle-run": s("Shuttle Run", "शटल रन", "ಶಟಲ್ ರನ್"),
  "triple-jump": s("Triple Jump", "तिहरी कूद", "ತ್ರಿವಿಧ ಜಿಗಿತ"),
  boxing: s("Boxing", "मुक्केबाज़ी", "ಬಾಕ್ಸಿಂಗ್"),
  judo: s("Judo", "जूडो", "ಜೂಡೋ"),
  "pull-ups": s("Pull-ups", "पुल-अप्स", "ಪುಲ್-ಅಪ್ಸ್"),
  "push-ups": s("Push-ups", "पुश-अप्स", "ಪುಶ್-ಅಪ್ಸ್"),
  "sit-ups": s("Sit-ups", "सिट-अप्स", "ಸಿಟ್-ಅಪ್ಸ್"),
  weightlifting: s("Weightlifting", "भारोत्तोलन", "ಭಾರ ಎತ್ತುವಿಕೆ"),
  wrestling: s("Wrestling", "कुश्ती", "ಕುಸ್ತಿ"),
  badminton: s("Badminton", "बैडमिंटन", "ಬ್ಯಾಡ್ಮಿಂಟನ್"),
  "ball-badminton": s("Ball Badminton", "बॉल बैडमिंटन", "ಬಾಲ್ ಬ್ಯಾಡ್ಮಿಂಟನ್"),
  "table-tennis": s("Table Tennis", "टेबल टेनिस", "ಟೇಬಲ್ ಟೆನ್ನಿಸ್"),
  tennikoit: s("Tennikoit", "टेनिकोइट", "ಟೆನ್ನಿಕಾಯ್ಟ್"),
  tennis: s("Tennis", "टेनिस", "ಟೆನಿಸ್"),
  archery: s("Archery", "तीरंदाज़ी", "ಬಿಲ್ಲುಗಾರಿಕೆ"),
  cycling: s("Cycling", "साइकिलिंग", "ಸೈಕ್ಲಿಂಗ್"),
  gymnastics: s("Gymnastics", "जिम्नास्टिक्स", "ಜಿಮ್ನಾಸ್ಟಿಕ್ಸ್"),
  "rope-climb": s("Rope Climb", "रस्सी चढ़ना", "ಹಗ್ಗ ಏರುವುದು"),
  skipping: s("Skipping", "रस्सी कूद", "ಹಗ್ಗ ನೆಗೆತ"),
  swimming: s("Swimming", "तैराकी", "ಈಜು"),
  yoga: s("Yoga", "योग", "ಯೋಗ"),
  basketball: s("Basketball", "बास्केटबॉल", "ಬಾಸ್ಕೆಟ್‌ಬಾಲ್"),
  "cricket-batting": s("Cricket Batting", "क्रिकेट बल्लेबाज़ी", "ಕ್ರಿಕೆಟ್ ಬ್ಯಾಟಿಂಗ್"),
  football: s("Football", "फ़ुटबॉल", "ಫುಟ್ಬಾಲ್"),
  handball: s("Handball", "हैंडबॉल", "ಹ್ಯಾಂಡ್‌ಬಾಲ್"),
  hockey: s("Hockey", "हॉकी", "ಹಾಕಿ"),
  "kho-kho": s("Kho-Kho", "खो-खो", "ಖೋ-ಖೋ"),
  throwball: s("Throwball", "थ्रोबॉल", "ಥ್ರೋಬಾಲ್"),
  volleyball: s("Volleyball", "वॉलीबॉल", "ವಾಲಿಬಾಲ್"),
};
