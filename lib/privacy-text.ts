import type { Lang } from "./i18n";

/** Privacy page copy. Each section is [heading, paragraphs]. Keep it in step with what the site really does. */
export type PrivacyCopy = { title: string; intro: string; sections: [string, string[]][]; contact: string };

export const PRIVACY: Record<Lang, PrivacyCopy> = {
  en: {
    title: "Privacy",
    intro: "Rural Talent Scout is a student project. This page says in plain words what we keep, who can see it, and how to remove it.",
    sections: [
      ["What we keep", [
        "Your account: email, username and a password. The password is stored scrambled, so we cannot read it.",
        "Your profile: name, age, gender, village, district, state and school or club, as far as you fill them in.",
        "Your videos, the result you report and the score you get.",
        "A record of each message to a sports body that you prepared on this site.",
      ]],
      ["Why we keep it", [
        "Only to check your video, give you a score and let approved scouts find you. We show no adverts and we do not sell data.",
      ]],
      ["Who can see it", [
        "You can see everything you saved.",
        "Scouts approved by an administrator can see your name, place, age, score and video only when your parent or guardian consent is switched on and your video is scored.",
        "Anyone with your proof link sees only your first name, district, state, sport, score and date. You can switch the link off on My results.",
      ]],
      ["Players under 18", [
        "Players under 18 need parent or guardian consent on their profile, and must confirm that a parent or guardian knows before preparing a message to a sports body. Age and consent are stated by the player; we do not check them.",
      ]],
      ["Services that handle your data", [
        "Supabase keeps sign-in, the database and private video storage. Vercel serves the website. Render runs the scoring service. GitHub runs the automatic video check.",
        "When you prepare an email, your full name, sport, score, district and state are sent to Anthropic's Claude so it can word the draft. If that fails, a plain template is used instead.",
      ]],
      ["Your choices", [
        "Edit or remove profile details on Profile. Turn off your proof link on My results.",
        "Delete your account on Profile. This permanently removes your login, profile, videos, scores and message records. It cannot be undone.",
      ]],
      ["Security", [
        "Every table is protected so players only reach their own data. Videos are private. Repeated wrong passwords lock the login for a while. Secret keys stay on our servers.",
      ]],
      ["Limits of this project", [
        "This is a college project, not a company. A score comes from the result you report and a video check. It is not an official rating.",
        "Email addresses of sports bodies come from public pages and may be out of date. If one fails, use Report a wrong email on the message page.",
      ]],
    ],
    contact: "Questions, or a request to remove data? Contact the project team through github.com/sabithismail/rural-talent-scout.",
  },
  hi: {
    title: "गोपनीयता",
    intro: "ग्रामीण प्रतिभा खोज एक छात्र प्रोजेक्ट है। यह पेज सरल शब्दों में बताता है कि हम क्या रखते हैं, उसे कौन देख सकता है और उसे कैसे हटाया जाए।",
    sections: [
      ["हम क्या रखते हैं", [
        "आपका खाता: ईमेल, यूज़रनेम और पासवर्ड। पासवर्ड बदले हुए रूप में रखा जाता है, इसलिए हम उसे पढ़ नहीं सकते।",
        "आपकी प्रोफ़ाइल: नाम, उम्र, लिंग, गाँव, जिला, राज्य और स्कूल या क्लब, जितना आप भरें।",
        "आपके वीडियो, आपका बताया परिणाम और आपका स्कोर।",
        "इस साइट पर खेल संस्था के लिए तैयार किए गए हर संदेश का रिकॉर्ड।",
      ]],
      ["क्यों रखते हैं", [
        "सिर्फ़ आपका वीडियो जाँचने, स्कोर देने और मंज़ूर स्काउट्स को आपको खोजने देने के लिए। हम विज्ञापन नहीं दिखाते और डेटा नहीं बेचते।",
      ]],
      ["इसे कौन देख सकता है", [
        "आपने जो सेव किया है वह सब आप देख सकते हैं।",
        "एडमिनिस्ट्रेटर से मंज़ूर स्काउट्स आपका नाम, जगह, उम्र, स्कोर और वीडियो तभी देख सकते हैं जब माता-पिता या अभिभावक की सहमति चालू हो और आपका वीडियो स्कोर हो चुका हो।",
        "आपके प्रमाण लिंक वाला कोई भी व्यक्ति सिर्फ़ आपका पहला नाम, जिला, राज्य, खेल, स्कोर और तारीख देखता है। आप \"मेरे परिणाम\" में यह लिंक बंद कर सकते हैं।",
      ]],
      ["18 साल से कम के खिलाड़ी", [
        "18 साल से कम के खिलाड़ियों की प्रोफ़ाइल में माता-पिता या अभिभावक की सहमति ज़रूरी है, और खेल संस्था के लिए संदेश बनाने से पहले पुष्टि करनी होगी कि उन्हें पता है। उम्र और सहमति खिलाड़ी खुद बताता है; हम इनकी जाँच नहीं करते।",
      ]],
      ["आपका डेटा संभालने वाली सेवाएँ", [
        "Supabase साइन-इन, डेटाबेस और निजी वीडियो स्टोरेज रखता है। Vercel वेबसाइट चलाता है। Render स्कोरिंग सेवा चलाता है। GitHub अपने आप वीडियो की जाँच चलाता है।",
        "जब आप ईमेल तैयार करते हैं, तो आपका पूरा नाम, खेल, स्कोर, जिला और राज्य Anthropic के Claude को भेजे जाते हैं ताकि वह मसौदा लिख सके। यह न हो सके तो सादा टेम्पलेट इस्तेमाल होता है।",
      ]],
      ["आपके विकल्प", [
        "प्रोफ़ाइल में जानकारी बदलें या हटाएँ। \"मेरे परिणाम\" में अपना प्रमाण लिंक बंद करें।",
        "प्रोफ़ाइल में अपना खाता हटाएँ। इससे आपका लॉगिन, प्रोफ़ाइल, वीडियो, स्कोर और संदेशों का रिकॉर्ड हमेशा के लिए हट जाता है। इसे वापस नहीं किया जा सकता।",
      ]],
      ["सुरक्षा", [
        "हर टेबल ऐसे सुरक्षित है कि खिलाड़ी सिर्फ़ अपना डेटा देख सकें। वीडियो निजी हैं। बार-बार गलत पासवर्ड डालने पर लॉगिन कुछ देर के लिए बंद हो जाता है। गुप्त कुंजियाँ सिर्फ़ हमारे सर्वर पर रहती हैं।",
      ]],
      ["इस प्रोजेक्ट की सीमाएँ", [
        "यह एक कॉलेज प्रोजेक्ट है, कंपनी नहीं। स्कोर आपके बताए परिणाम और वीडियो की जाँच से बनता है। यह कोई आधिकारिक रेटिंग नहीं है।",
        "खेल संस्थाओं के ईमेल पते सार्वजनिक पेजों से लिए गए हैं और पुराने हो सकते हैं। कोई पता काम न करे तो संदेश वाले पेज पर \"गलत ईमेल की रिपोर्ट करें\" दबाएँ।",
      ]],
    ],
    contact: "सवाल हैं, या डेटा हटवाना है? github.com/sabithismail/rural-talent-scout के ज़रिए प्रोजेक्ट टीम से संपर्क करें।",
  },
  kn: {
    title: "ಗೋಪ್ಯತೆ",
    intro: "ಗ್ರಾಮೀಣ ಪ್ರತಿಭಾ ಶೋಧ ಒಂದು ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆ. ನಾವು ಏನನ್ನು ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ, ಅದನ್ನು ಯಾರು ನೋಡಬಹುದು ಮತ್ತು ಅದನ್ನು ಹೇಗೆ ತೆಗೆಯಬೇಕು ಎಂಬುದನ್ನು ಈ ಪುಟ ಸರಳ ಮಾತುಗಳಲ್ಲಿ ಹೇಳುತ್ತದೆ.",
    sections: [
      ["ನಾವು ಏನನ್ನು ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ", [
        "ನಿಮ್ಮ ಖಾತೆ: ಇಮೇಲ್, ಬಳಕೆದಾರ ಹೆಸರು ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್. ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾದ ರೂಪದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ, ಹಾಗಾಗಿ ನಾವು ಅದನ್ನು ಓದಲಾಗುವುದಿಲ್ಲ.",
        "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್: ಹೆಸರು, ವಯಸ್ಸು, ಲಿಂಗ, ಹಳ್ಳಿ, ಜಿಲ್ಲೆ, ರಾಜ್ಯ ಮತ್ತು ಶಾಲೆ ಅಥವಾ ಕ್ಲಬ್, ನೀವು ತುಂಬಿದಷ್ಟು.",
        "ನಿಮ್ಮ ವೀಡಿಯೊಗಳು, ನೀವು ತಿಳಿಸಿದ ಫಲಿತಾಂಶ ಮತ್ತು ನಿಮ್ಮ ಸ್ಕೋರ್.",
        "ಈ ಸೈಟ್‌ನಲ್ಲಿ ಕ್ರೀಡಾ ಸಂಸ್ಥೆಗೆ ನೀವು ಸಿದ್ಧಪಡಿಸಿದ ಪ್ರತಿ ಸಂದೇಶದ ದಾಖಲೆ.",
      ]],
      ["ಏಕೆ ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ", [
        "ನಿಮ್ಮ ವೀಡಿಯೊ ಪರಿಶೀಲಿಸಲು, ಸ್ಕೋರ್ ನೀಡಲು ಮತ್ತು ಒಪ್ಪಿಗೆ ಪಡೆದ ಸ್ಕೌಟ್‌ಗಳು ನಿಮ್ಮನ್ನು ಹುಡುಕಲು ಮಾತ್ರ. ನಾವು ಜಾಹೀರಾತು ತೋರಿಸುವುದಿಲ್ಲ, ಡೇಟಾ ಮಾರುವುದಿಲ್ಲ.",
      ]],
      ["ಯಾರು ನೋಡಬಹುದು", [
        "ನೀವು ಉಳಿಸಿದ ಎಲ್ಲವನ್ನೂ ನೀವು ನೋಡಬಹುದು.",
        "ಆಡಳಿತಗಾರರಿಂದ ಒಪ್ಪಿಗೆ ಪಡೆದ ಸ್ಕೌಟ್‌ಗಳು, ನಿಮ್ಮ ಪೋಷಕರ ಅಥವಾ ಪಾಲಕರ ಒಪ್ಪಿಗೆ ಆನ್ ಆಗಿದ್ದು ನಿಮ್ಮ ವೀಡಿಯೊ ಸ್ಕೋರ್ ಆಗಿದ್ದರೆ ಮಾತ್ರ ನಿಮ್ಮ ಹೆಸರು, ಸ್ಥಳ, ವಯಸ್ಸು, ಸ್ಕೋರ್ ಮತ್ತು ವೀಡಿಯೊ ನೋಡಬಹುದು.",
        "ನಿಮ್ಮ ಪುರಾವೆ ಲಿಂಕ್ ಇರುವವರು ನಿಮ್ಮ ಮೊದಲ ಹೆಸರು, ಜಿಲ್ಲೆ, ರಾಜ್ಯ, ಆಟ, ಸ್ಕೋರ್ ಮತ್ತು ದಿನಾಂಕ ಮಾತ್ರ ನೋಡುತ್ತಾರೆ. \"ನನ್ನ ಫಲಿತಾಂಶಗಳು\" ಪುಟದಲ್ಲಿ ಈ ಲಿಂಕ್ ಆಫ್ ಮಾಡಬಹುದು.",
      ]],
      ["18 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಆಟಗಾರರು", [
        "18 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಆಟಗಾರರ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಪೋಷಕರ ಅಥವಾ ಪಾಲಕರ ಒಪ್ಪಿಗೆ ಬೇಕು, ಮತ್ತು ಕ್ರೀಡಾ ಸಂಸ್ಥೆಗೆ ಸಂದೇಶ ಸಿದ್ಧಪಡಿಸುವ ಮೊದಲು ಅವರಿಗೆ ತಿಳಿದಿದೆ ಎಂದು ದೃಢೀಕರಿಸಬೇಕು. ವಯಸ್ಸು ಮತ್ತು ಒಪ್ಪಿಗೆಯನ್ನು ಆಟಗಾರರೇ ಹೇಳುತ್ತಾರೆ; ನಾವು ಅವನ್ನು ಪರಿಶೀಲಿಸುವುದಿಲ್ಲ.",
      ]],
      ["ನಿಮ್ಮ ಡೇಟಾ ನಿರ್ವಹಿಸುವ ಸೇವೆಗಳು", [
        "Supabase ಸೈನ್-ಇನ್, ಡೇಟಾಬೇಸ್ ಮತ್ತು ಖಾಸಗಿ ವೀಡಿಯೊ ಸಂಗ್ರಹ ಇಟ್ಟುಕೊಳ್ಳುತ್ತದೆ. Vercel ವೆಬ್‌ಸೈಟ್ ನಡೆಸುತ್ತದೆ. Render ಸ್ಕೋರಿಂಗ್ ಸೇವೆ ನಡೆಸುತ್ತದೆ. GitHub ತಾನಾಗಿ ವೀಡಿಯೊ ಪರಿಶೀಲನೆ ನಡೆಸುತ್ತದೆ.",
        "ನೀವು ಇಮೇಲ್ ಸಿದ್ಧಪಡಿಸುವಾಗ, ಕರಡು ಬರೆಯಲು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು, ಆಟ, ಸ್ಕೋರ್, ಜಿಲ್ಲೆ ಮತ್ತು ರಾಜ್ಯ Anthropic ನ Claude ಗೆ ಹೋಗುತ್ತದೆ. ಅದು ಆಗದಿದ್ದರೆ ಸರಳ ಟೆಂಪ್ಲೇಟ್ ಬಳಸುತ್ತೇವೆ.",
      ]],
      ["ನಿಮ್ಮ ಆಯ್ಕೆಗಳು", [
        "ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ವಿವರಗಳನ್ನು ಬದಲಿಸಿ ಅಥವಾ ತೆಗೆಯಿರಿ. \"ನನ್ನ ಫಲಿತಾಂಶಗಳು\" ಪುಟದಲ್ಲಿ ಪುರಾವೆ ಲಿಂಕ್ ಆಫ್ ಮಾಡಿ.",
        "ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಿ. ಇದು ನಿಮ್ಮ ಲಾಗಿನ್, ಪ್ರೊಫೈಲ್, ವೀಡಿಯೊಗಳು, ಸ್ಕೋರ್‌ಗಳು ಮತ್ತು ಸಂದೇಶ ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕುತ್ತದೆ. ಇದನ್ನು ಹಿಂತಿರುಗಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
      ]],
      ["ಭದ್ರತೆ", [
        "ಪ್ರತಿ ಟೇಬಲ್ ಅನ್ನು ಆಟಗಾರರು ತಮ್ಮ ಡೇಟಾವನ್ನು ಮಾತ್ರ ನೋಡುವಂತೆ ರಕ್ಷಿಸಲಾಗಿದೆ. ವೀಡಿಯೊಗಳು ಖಾಸಗಿ. ಪದೇ ಪದೇ ತಪ್ಪು ಪಾಸ್‌ವರ್ಡ್ ಹಾಕಿದರೆ ಲಾಗಿನ್ ಸ್ವಲ್ಪ ಹೊತ್ತು ಲಾಕ್ ಆಗುತ್ತದೆ. ರಹಸ್ಯ ಕೀಗಳು ನಮ್ಮ ಸರ್ವರ್‌ನಲ್ಲಿ ಮಾತ್ರ ಇರುತ್ತವೆ.",
      ]],
      ["ಈ ಯೋಜನೆಯ ಮಿತಿಗಳು", [
        "ಇದು ಕಾಲೇಜು ಯೋಜನೆ, ಕಂಪನಿಯಲ್ಲ. ಸ್ಕೋರ್ ನೀವು ತಿಳಿಸಿದ ಫಲಿತಾಂಶ ಮತ್ತು ವೀಡಿಯೊ ಪರಿಶೀಲನೆಯಿಂದ ಬರುತ್ತದೆ. ಇದು ಅಧಿಕೃತ ರೇಟಿಂಗ್ ಅಲ್ಲ.",
        "ಕ್ರೀಡಾ ಸಂಸ್ಥೆಗಳ ಇಮೇಲ್ ವಿಳಾಸಗಳು ಸಾರ್ವಜನಿಕ ಪುಟಗಳಿಂದ ಬಂದಿವೆ ಮತ್ತು ಹಳೆಯದಾಗಿರಬಹುದು. ಒಂದು ವಿಳಾಸ ಕೆಲಸ ಮಾಡದಿದ್ದರೆ ಸಂದೇಶ ಪುಟದಲ್ಲಿ \"ತಪ್ಪು ಇಮೇಲ್ ವರದಿ ಮಾಡಿ\" ಒತ್ತಿ.",
      ]],
    ],
    contact: "ಪ್ರಶ್ನೆಗಳಿವೆಯೇ, ಅಥವಾ ಡೇಟಾ ತೆಗೆಯಬೇಕೆ? github.com/sabithismail/rural-talent-scout ಮೂಲಕ ಯೋಜನಾ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  },
};
