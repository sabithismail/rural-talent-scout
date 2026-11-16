import type { Lang } from "./i18n";

type T = Record<Lang, string>;

/** Strings for the privacy link, account deletion, WhatsApp share and wrong-email reports. */
export const accountStrings: Record<string, T> = {
  privacy: { en: "Privacy", hi: "गोपनीयता", kn: "ಗೋಪ್ಯತೆ" },
  deleteTitle: { en: "Delete my account", hi: "मेरा खाता हटाएँ", kn: "ನನ್ನ ಖಾತೆಯನ್ನು ಅಳಿಸಿ" },
  deleteLede: {
    en: "This permanently removes your login, profile, videos, scores and message records. It cannot be undone.",
    hi: "इससे आपका लॉगिन, प्रोफ़ाइल, वीडियो, स्कोर और संदेशों का रिकॉर्ड हमेशा के लिए हट जाएगा। इसे वापस नहीं किया जा सकता।",
    kn: "ಇದು ನಿಮ್ಮ ಲಾಗಿನ್, ಪ್ರೊಫೈಲ್, ವೀಡಿಯೊಗಳು, ಸ್ಕೋರ್‌ಗಳು ಮತ್ತು ಸಂದೇಶ ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕುತ್ತದೆ. ಇದನ್ನು ಹಿಂತಿರುಗಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
  },
  deleteConfirmBox: {
    en: "I understand this cannot be undone",
    hi: "मुझे पता है कि इसे वापस नहीं किया जा सकता",
    kn: "ಇದನ್ನು ಹಿಂತಿರುಗಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ ಎಂದು ನನಗೆ ತಿಳಿದಿದೆ",
  },
  deleteButton: { en: "Delete my account", hi: "मेरा खाता हटाएँ", kn: "ನನ್ನ ಖಾತೆಯನ್ನು ಅಳಿಸಿ" },
  deleteWorking: { en: "Deleting...", hi: "हटा रहे हैं...", kn: "ಅಳಿಸುತ್ತಿದ್ದೇವೆ..." },
  deleteFailed: {
    en: "Couldn't delete the account. Check your connection and try again.",
    hi: "खाता नहीं हट सका। कनेक्शन जाँचें और दोबारा कोशिश करें।",
    kn: "ಖಾತೆಯನ್ನು ಅಳಿಸಲಾಗಲಿಲ್ಲ. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  waShare: { en: "Share on WhatsApp", hi: "WhatsApp पर शेयर करें", kn: "WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ" },
  waMessage: {
    en: "My score on Rural Talent Scout: {sport} {score}/100. Check it here: {link}",
    hi: "Rural Talent Scout पर मेरा स्कोर: {sport} {score}/100। यहाँ जाँचें: {link}",
    kn: "Rural Talent Scout ನಲ್ಲಿ ನನ್ನ ಸ್ಕೋರ್: {sport} {score}/100. ಇಲ್ಲಿ ಪರಿಶೀಲಿಸಿ: {link}",
  },
  waHint: {
    en: "Anyone with the link sees only your first name, district, state, sport, score and date. You can switch it off.",
    hi: "लिंक वाला कोई भी व्यक्ति सिर्फ़ आपका पहला नाम, जिला, राज्य, खेल, स्कोर और तारीख देखता है। आप इसे बंद कर सकते हैं।",
    kn: "ಲಿಂಕ್ ಇರುವವರು ನಿಮ್ಮ ಮೊದಲ ಹೆಸರು, ಜಿಲ್ಲೆ, ರಾಜ್ಯ, ಆಟ, ಸ್ಕೋರ್ ಮತ್ತು ದಿನಾಂಕ ಮಾತ್ರ ನೋಡುತ್ತಾರೆ. ಇದನ್ನು ನೀವು ಆಫ್ ಮಾಡಬಹುದು.",
  },
  visPublic: { en: "Visible to scouts", hi: "स्काउट्स को दिखता है", kn: "ಸ್ಕೌಟ್‌ಗಳಿಗೆ ಕಾಣುತ್ತದೆ" },
  visPrivate: { en: "Private: only you", hi: "निजी: सिर्फ़ आप", kn: "ಖಾಸಗಿ: ನೀವು ಮಾತ್ರ" },
  visMakePublic: { en: "Show to scouts", hi: "स्काउट्स को दिखाएँ", kn: "ಸ್ಕೌಟ್‌ಗಳಿಗೆ ತೋರಿಸಿ" },
  visMakePrivate: { en: "Make private", hi: "निजी करें", kn: "ಖಾಸಗಿ ಮಾಡಿ" },
  visHint: {
    en: "When visible, verified scouts can watch this video and email you directly. Switch it back any time.",
    hi: "जब यह दिखता है, तो सत्यापित स्काउट्स यह वीडियो देख सकते हैं और आपको सीधे ईमेल कर सकते हैं। कभी भी वापस बदलें।",
    kn: "ಇದು ಕಾಣುವಾಗ, ಪರಿಶೀಲಿತ ಸ್ಕೌಟ್‌ಗಳು ಈ ವೀಡಿಯೊ ನೋಡಬಹುದು ಮತ್ತು ನಿಮಗೆ ನೇರವಾಗಿ ಇಮೇಲ್ ಮಾಡಬಹುದು. ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಿಸಿ.",
  },
  visNeedConsent: {
    en: "Turn on parent or guardian consent on your profile to show videos to scouts.",
    hi: "स्काउट्स को वीडियो दिखाने के लिए प्रोफ़ाइल में माता-पिता या अभिभावक की सहमति चालू करें।",
    kn: "ಸ್ಕೌಟ್‌ಗಳಿಗೆ ವೀಡಿಯೊ ತೋರಿಸಲು ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಪೋಷಕರ ಅಥವಾ ಪಾಲಕರ ಒಪ್ಪಿಗೆ ಆನ್ ಮಾಡಿ.",
  },
  videoRemoved: {
    en: "The video was removed to free up space. Your score is kept.",
    hi: "जगह बनाने के लिए वीडियो हटा दिया गया। आपका स्कोर सुरक्षित है।",
    kn: "ಜಾಗ ಖಾಲಿ ಮಾಡಲು ವೀಡಿಯೊ ತೆಗೆದುಹಾಕಲಾಗಿದೆ. ನಿಮ್ಮ ಸ್ಕೋರ್ ಉಳಿದಿದೆ.",
  },
  emailPlayer: { en: "Email player", hi: "खिलाड़ी को ईमेल करें", kn: "ಆಟಗಾರರಿಗೆ ಇಮೇಲ್ ಮಾಡಿ" },
  emailSubject: { en: "Rural Talent Scout: your {sport} score", hi: "Rural Talent Scout: आपका {sport} स्कोर", kn: "Rural Talent Scout: ನಿಮ್ಮ {sport} ಸ್ಕೋರ್" },
  emailBody: {
    en: "Hello {name},\n\nI am a scout on Rural Talent Scout and I watched your {sport} video (score {score}/100). I would like to talk to you about your game.\n\nRegards",
    hi: "नमस्ते {name},\n\nमैं Rural Talent Scout पर स्काउट हूँ और मैंने आपका {sport} वीडियो देखा (स्कोर {score}/100)। मैं आपके खेल के बारे में बात करना चाहता हूँ।\n\nधन्यवाद",
    kn: "ನಮಸ್ಕಾರ {name},\n\nನಾನು Rural Talent Scout ನಲ್ಲಿ ಸ್ಕೌಟ್ ಮತ್ತು ನಿಮ್ಮ {sport} ವೀಡಿಯೊ ನೋಡಿದೆ (ಸ್ಕೋರ್ {score}/100). ನಿಮ್ಮ ಆಟದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಯಸುತ್ತೇನೆ.\n\nಧನ್ಯವಾದ",
  },
  feedTitle: { en: "Scout feed", hi: "स्काउट फ़ीड", kn: "ಸ್ಕೌಟ್ ಫೀಡ್" },
  feedLede: {
    en: "Players who chose to show their video. Email them directly.",
    hi: "वे खिलाड़ी जिन्होंने अपना वीडियो दिखाना चुना। सीधे ईमेल करें।",
    kn: "ತಮ್ಮ ವೀಡಿಯೊ ತೋರಿಸಲು ಆಯ್ಕೆ ಮಾಡಿದ ಆಟಗಾರರು. ನೇರವಾಗಿ ಇಮೇಲ್ ಮಾಡಿ.",
  },
  reportEmail: { en: "Report a wrong email", hi: "गलत ईमेल की रिपोर्ट करें", kn: "ತಪ್ಪು ಇಮೇಲ್ ವರದಿ ಮಾಡಿ" },
  reportBounced: { en: "The email bounced", hi: "ईमेल लौट आया", kn: "ಇಮೇಲ್ ಹಿಂತಿರುಗಿತು" },
  reportWrongBody: { en: "Wrong organisation", hi: "गलत संस्था", kn: "ತಪ್ಪು ಸಂಸ್ಥೆ" },
  reportOther: { en: "Something else", hi: "कुछ और", kn: "ಬೇರೆ ಕಾರಣ" },
  reportSent: {
    en: "Thanks. We will check this address.",
    hi: "धन्यवाद। हम इस पते की जाँच करेंगे।",
    kn: "ಧನ್ಯವಾದ. ಈ ವಿಳಾಸವನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ.",
  },
  reportFailed: {
    en: "Couldn't send the report. Try again.",
    hi: "रिपोर्ट नहीं भेजी जा सकी। दोबारा कोशिश करें।",
    kn: "ವರದಿ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
};
