"use client";
import { extra, categories, sportNamesExtra } from "./i18n-extra";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "hi" | "kn";

const dict: Record<string, Record<Lang, string>> = {
  appName: { en: "Rural Talent Scout", hi: "ग्रामीण प्रतिभा खोज", kn: "ಗ್ರಾಮೀಣ ಪ್ರತಿಭಾ ಶೋಧ" },
  tagline: {
    en: "Talent is everywhere. Let scouts see yours.",
    hi: "प्रतिभा हर जगह है। स्काउट्स को अपनी प्रतिभा दिखाइए।",
    kn: "ಪ್ರತಿಭೆ ಎಲ್ಲೆಡೆ ಇದೆ. ನಿಮ್ಮದನ್ನು ಸ್ಕೌಟ್‌ಗಳಿಗೆ ತೋರಿಸಿ.",
  },
  pickSport: { en: "Select a sport", hi: "खेल चुनें", kn: "ಆಟವನ್ನು ಆರಿಸಿ" },
  home: { en: "Home", hi: "होम", kn: "ಮುಖಪುಟ" },
  mySubmissions: { en: "My videos", hi: "मेरे वीडियो", kn: "ನನ್ನ ವೀಡಿಯೊಗಳು" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", kn: "ಪ್ರೊಫೈಲ್" },
  scoutDashboard: { en: "Scout dashboard", hi: "स्काउट डैशबोर्ड", kn: "ಸ್ಕೌಟ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
  login: { en: "Log in", hi: "लॉग इन", kn: "ಲಾಗಿನ್" },
  signup: { en: "Sign up", hi: "साइन अप", kn: "ಸೈನ್ ಅಪ್" },
  logout: { en: "Log out", hi: "लॉग आउट", kn: "ಲಾಗ್ ಔಟ್" },
  email: { en: "Email", hi: "ईमेल", kn: "ಇಮೇಲ್" },
  password: { en: "Password", hi: "पासवर्ड", kn: "ಪಾಸ್‌ವರ್ಡ್" },
  fullName: { en: "Full name", hi: "पूरा नाम", kn: "ಪೂರ್ಣ ಹೆಸರು" },
  iAmPlayer: { en: "I am a player", hi: "मैं खिलाड़ी हूँ", kn: "ನಾನು ಆಟಗಾರ" },
  iAmScout: { en: "I am a scout / coach", hi: "मैं स्काउट / कोच हूँ", kn: "ನಾನು ಸ್ಕೌಟ್ / ಕೋಚ್" },
  drill: { en: "Your drill", hi: "आपका ड्रिल", kn: "ನಿಮ್ಮ ಡ್ರಿಲ್" },
  cameraTips: { en: "How to film", hi: "वीडियो कैसे बनाएं", kn: "ವೀಡಿಯೊ ಹೇಗೆ ಮಾಡುವುದು" },
  step2: { en: "Upload your video", hi: "अपना वीडियो अपलोड करें", kn: "ನಿಮ್ಮ ವೀಡಿಯೊ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ" },
  chooseVideo: { en: "Record or choose video", hi: "वीडियो बनाएं या चुनें", kn: "ವೀಡಿಯೊ ಮಾಡಿ ಅಥವಾ ಆರಿಸಿ" },
  notes: { en: "Notes (optional)", hi: "टिप्पणी (वैकल्पिक)", kn: "ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)" },
  upload: { en: "Upload", hi: "अपलोड करें", kn: "ಅಪ್‌ಲೋಡ್" },
  uploading: { en: "Uploading…", hi: "अपलोड हो रहा है…", kn: "ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ…" },
  uploaded: { en: "Uploaded! We will score it soon.", hi: "अपलोड हो गया! जल्द ही स्कोर मिलेगा।", kn: "ಅಪ್‌ಲೋಡ್ ಆಯಿತು! ಶೀಘ್ರದಲ್ಲೇ ಸ್ಕೋರ್ ಸಿಗಲಿದೆ." },
  queued: {
    en: "No network. Video saved on your phone and will upload automatically when you are online.",
    hi: "नेटवर्क नहीं है। वीडियो फ़ोन में सेव है और नेटवर्क आने पर अपने-आप अपलोड होगा।",
    kn: "ನೆಟ್‌ವರ್ಕ್ ಇಲ್ಲ. ವೀಡಿಯೊ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿದಿದೆ, ನೆಟ್‌ವರ್ಕ್ ಬಂದಾಗ ತಾನಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತದೆ.",
  },
  needLogin: { en: "Please log in to upload.", hi: "अपलोड के लिए लॉग इन करें।", kn: "ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಲಾಗಿನ್ ಮಾಡಿ." },
  save: { en: "Save", hi: "सेव करें", kn: "ಉಳಿಸಿ" },
  saved: { en: "Saved", hi: "सेव हो गया", kn: "ಉಳಿಸಲಾಗಿದೆ" },
  age: { en: "Age", hi: "उम्र", kn: "ವಯಸ್ಸು" },
  village: { en: "Village / town", hi: "गाँव / कस्बा", kn: "ಹಳ್ಳಿ / ಪಟ್ಟಣ" },
  district: { en: "District", hi: "जिला", kn: "ಜಿಲ್ಲೆ" },
  state: { en: "State", hi: "राज्य", kn: "ರಾಜ್ಯ" },
  school: { en: "School / club", hi: "स्कूल / क्लब", kn: "ಶಾಲೆ / ಕ್ಲಬ್" },
  consent: {
    en: "I (or my parent/guardian) allow verified scouts to see my profile and scored videos.",
    hi: "मैं (या मेरे माता-पिता/अभिभावक) सत्यापित स्काउट्स को मेरी प्रोफ़ाइल और स्कोर किए गए वीडियो देखने की अनुमति देते हैं।",
    kn: "ನಾನು (ಅಥವಾ ನನ್ನ ಪೋಷಕರು) ಪರಿಶೀಲಿತ ಸ್ಕೌಟ್‌ಗಳಿಗೆ ನನ್ನ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸ್ಕೋರ್ ಆದ ವೀಡಿಯೊಗಳನ್ನು ನೋಡಲು ಅನುಮತಿಸುತ್ತೇನೆ.",
  },
  status: { en: "Status", hi: "स्थिति", kn: "ಸ್ಥಿತಿ" },
  score: { en: "Score", hi: "स्कोर", kn: "ಸ್ಕೋರ್" },
  pending: { en: "Waiting for score", hi: "स्कोर का इंतज़ार", kn: "ಸ್ಕೋರ್‌ಗೆ ಕಾಯುತ್ತಿದೆ" },
  scored: { en: "Scored", hi: "स्कोर हो गया", kn: "ಸ್ಕೋರ್ ಆಗಿದೆ" },
  rejected: { en: "Rejected", hi: "अस्वीकृत", kn: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ" },
  shortlist: { en: "Shortlist", hi: "शॉर्टलिस्ट", kn: "ಶಾರ್ಟ್‌ಲಿಸ್ಟ್" },
  shortlisted: { en: "Shortlisted", hi: "शॉर्टलिस्ट किया", kn: "ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಆಗಿದೆ" },
  allSports: { en: "All sports", hi: "सभी खेल", kn: "ಎಲ್ಲಾ ಆಟಗಳು" },
  minScore: { en: "Min score", hi: "न्यूनतम स्कोर", kn: "ಕನಿಷ್ಠ ಸ್ಕೋರ್" },
  noResults: { en: "Nothing here yet.", hi: "अभी कुछ नहीं है।", kn: "ಇನ್ನೂ ಏನೂ ಇಲ್ಲ." },
  notVerified: {
    en: "Your scout account is waiting for verification. You will see players once it is approved.",
    hi: "आपका स्काउट अकाउंट सत्यापन का इंतज़ार कर रहा है। मंज़ूरी के बाद खिलाड़ी दिखेंगे।",
    kn: "ನಿಮ್ಮ ಸ್ಕೌಟ್ ಖಾತೆ ಪರಿಶೀಲನೆಗೆ ಕಾಯುತ್ತಿದೆ. ಅನುಮೋದನೆಯ ನಂತರ ಆಟಗಾರರು ಕಾಣುತ್ತಾರೆ.",
  },
  back: { en: "Back", hi: "वापस", kn: "ಹಿಂದೆ" },
  heroSub: {
    en: "Film one simple drill on your phone. Our Java engine scores it against your age group. Scouts do the rest.",
    hi: "फ़ोन पर एक आसान ड्रिल रिकॉर्ड करें। हमारा Java इंजन आपकी उम्र के समूह से तुलना करके स्कोर देता है। बाकी काम स्काउट्स करेंगे।",
    kn: "ಫೋನ್‌ನಲ್ಲಿ ಒಂದು ಸರಳ ಡ್ರಿಲ್ ರೆಕಾರ್ಡ್ ಮಾಡಿ. ನಮ್ಮ Java ಎಂಜಿನ್ ನಿಮ್ಮ ವಯೋಮಾನದೊಂದಿಗೆ ಹೋಲಿಸಿ ಸ್ಕೋರ್ ನೀಡುತ್ತದೆ. ಉಳಿದದ್ದನ್ನು ಸ್ಕೌಟ್‌ಗಳು ನೋಡಿಕೊಳ್ಳುತ್ತಾರೆ.",
  },
  how: { en: "How it works", hi: "यह कैसे काम करता है", kn: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ" },
  how1: { en: "Pick your sport", hi: "अपना खेल चुनें", kn: "ನಿಮ್ಮ ಆಟವನ್ನು ಆರಿಸಿ" },
  how2: { en: "Film the drill", hi: "ड्रिल रिकॉर्ड करें", kn: "ಡ್ರಿಲ್ ರೆಕಾರ್ಡ್ ಮಾಡಿ" },
  how3: { en: "Get scored and noticed", hi: "स्कोर पाएं और नज़र में आएं", kn: "ಸ್ಕೋರ್ ಪಡೆಯಿರಿ, ಗಮನ ಸೆಳೆಯಿರಿ" },
  about: { en: "About", hi: "परिचय", kn: "ಬಗ್ಗೆ" },
  yourResult: { en: "Your result", hi: "आपका परिणाम", kn: "ನಿಮ್ಮ ಫಲಿತಾಂಶ" },
  resultHint: {
    en: "Enter what you measured. The Java engine will score it.",
    hi: "जो नापा वह लिखें। Java इंजन स्कोर देगा।",
    kn: "ನೀವು ಅಳೆದದ್ದನ್ನು ಬರೆಯಿರಿ. Java ಎಂಜಿನ್ ಸ್ಕೋರ್ ನೀಡುತ್ತದೆ.",
  },
  estimatedScore: { en: "Your estimated score", hi: "आपका अनुमानित स्कोर", kn: "ನಿಮ್ಮ ಅಂದಾಜು ಸ್ಕೋರ್" },
  reportedResult: { en: "Reported result", hi: "बताया गया परिणाम", kn: "ತಿಳಿಸಿದ ಫಲಿತಾಂಶ" },
  gender: { en: "Gender", hi: "लिंग", kn: "ಲಿಂಗ" },
  male: { en: "Male", hi: "पुरुष", kn: "ಪುರುಷ" },
  female: { en: "Female", hi: "महिला", kn: "ಮಹಿಳೆ" },
  preferNot: { en: "Prefer not to say", hi: "बताना नहीं चाहते", kn: "ಹೇಳಲು ಇಚ್ಛಿಸುವುದಿಲ್ಲ" },
  poweredByJava: {
    en: "Scores are calculated by a Java Spring Boot service",
    hi: "स्कोर Java Spring Boot सेवा से गणना होते हैं",
    kn: "ಸ್ಕೋರ್‌ಗಳನ್ನು Java Spring Boot ಸೇವೆ ಲೆಕ್ಕಹಾಕುತ್ತದೆ",
  },
  needAge: {
    en: "Add your age and gender in Profile to see your score.",
    hi: "स्कोर देखने के लिए प्रोफ़ाइल में उम्र और लिंग जोड़ें।",
    kn: "ಸ್ಕೋರ್ ನೋಡಲು ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ವಯಸ್ಸು ಮತ್ತು ಲಿಂಗ ಸೇರಿಸಿ.",
  },
  serviceDown: {
    en: "The score service is not reachable right now. Your video is saved and will be scored later.",
    hi: "स्कोर सेवा अभी उपलब्ध नहीं है। आपका वीडियो सेव है, बाद में स्कोर होगा।",
    kn: "ಸ್ಕೋರ್ ಸೇವೆ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ನಿಮ್ಮ ವೀಡಿಯೊ ಉಳಿಸಲಾಗಿದೆ, ನಂತರ ಸ್ಕೋರ್ ಆಗುತ್ತದೆ.",
  },
  selectSport: { en: "Select a sport", hi: "खेल चुनें", kn: "ಆಟವನ್ನು ಆರಿಸಿ" },
  searchPlaceholder: { en: "Search sports, e.g. kabaddi, sprint, archery", hi: "खेल खोजें, जैसे कबड्डी, दौड़, तीरंदाज़ी", kn: "ಆಟ ಹುಡುಕಿ, ಉದಾ. ಕಬಡ್ಡಿ, ಓಟ, ಬಿಲ್ಲುಗಾರಿಕೆ" },
  allCategories: { en: "All", hi: "सभी", kn: "ಎಲ್ಲಾ" },
  noSport: { en: "No sport matches your search. Try another word.", hi: "कोई खेल नहीं मिला। दूसरा शब्द आज़माएं।", kn: "ಯಾವುದೇ ಆಟ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ." },
  whatTitle: { en: "What is this?", hi: "यह क्या है?", kn: "ಇದು ಏನು?" },
  whatBody: {
    en: "Rural Talent Scout lets young athletes film one simple drill on a phone, get an honest 0 to 100 score for their age group, and be seen by verified scouts and coaches.",
    hi: "ग्रामीण प्रतिभा खोज में युवा खिलाड़ी फ़ोन पर एक आसान ड्रिल रिकॉर्ड करते हैं, अपनी उम्र के समूह में 0 से 100 का सही स्कोर पाते हैं और सत्यापित स्काउट्स और कोचों की नज़र में आते हैं।",
    kn: "ಗ್ರಾಮೀಣ ಪ್ರತಿಭಾ ಶೋಧದಲ್ಲಿ ಯುವ ಕ್ರೀಡಾಪಟುಗಳು ಫೋನ್‌ನಲ್ಲಿ ಒಂದು ಸರಳ ಡ್ರಿಲ್ ರೆಕಾರ್ಡ್ ಮಾಡಿ, ತಮ್ಮ ವಯೋಮಾನಕ್ಕೆ 0 ರಿಂದ 100 ಸರಿಯಾದ ಸ್ಕೋರ್ ಪಡೆದು, ಪರಿಶೀಲಿತ ಸ್ಕೌಟ್‌ಗಳು ಮತ್ತು ಕೋಚ್‌ಗಳ ಕಣ್ಣಿಗೆ ಬೀಳುತ್ತಾರೆ.",
  },
  whyTitle: { en: "Why does it exist?", hi: "यह क्यों है?", kn: "ಇದು ಏಕೆ ಇದೆ?" },
  whyBody: {
    en: "Gifted players in villages often never get a trial: scouts cannot reach them and selection camps are far away. A phone video should be enough to be noticed.",
    hi: "गाँवों के प्रतिभाशाली खिलाड़ियों को अक्सर ट्रायल का मौका नहीं मिलता: स्काउट्स वहाँ पहुँच नहीं पाते और चयन शिविर दूर होते हैं। नज़र में आने के लिए फ़ोन का एक वीडियो काफ़ी होना चाहिए।",
    kn: "ಹಳ್ಳಿಗಳ ಪ್ರತಿಭಾವಂತ ಆಟಗಾರರಿಗೆ ಹೆಚ್ಚಾಗಿ ಟ್ರಯಲ್ ಸಿಗುವುದಿಲ್ಲ: ಸ್ಕೌಟ್‌ಗಳು ಅಲ್ಲಿಗೆ ತಲುಪುವುದಿಲ್ಲ, ಆಯ್ಕೆ ಶಿಬಿರಗಳು ದೂರದಲ್ಲಿರುತ್ತವೆ. ಗಮನ ಸೆಳೆಯಲು ಫೋನ್ ವೀಡಿಯೊ ಸಾಕಾಗಬೇಕು.",
  },
  installApp: { en: "Install the app", hi: "ऐप इंस्टॉल करें", kn: "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ" },
  installHint: { en: "Add it to your home screen and use it like an app.", hi: "इसे होम स्क्रीन पर जोड़ें और ऐप की तरह इस्तेमाल करें।", kn: "ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ ಆ್ಯಪ್‌ನಂತೆ ಬಳಸಿ." },
  installIos: { en: "Tap Share, then Add to Home Screen.", hi: "Share दबाएं, फिर Add to Home Screen चुनें।", kn: "Share ಒತ್ತಿ, ನಂತರ Add to Home Screen ಆರಿಸಿ." },
  install: { en: "Install", hi: "इंस्टॉल", kn: "ಇನ್‌ಸ್ಟಾಲ್" },
  notNow: { en: "Not now", hi: "अभी नहीं", kn: "ಈಗ ಬೇಡ" },
  username: { en: "Username", hi: "यूज़रनेम", kn: "ಬಳಕೆದಾರ ಹೆಸರು" },
  usernameTaken: { en: "This username is taken", hi: "यह यूज़रनेम पहले से लिया जा चुका है", kn: "ಈ ಬಳಕೆದಾರ ಹೆಸರು ಈಗಾಗಲೇ ಬಳಕೆಯಲ್ಲಿದೆ" },
  usernameFree: { en: "Username is available", hi: "यूज़रनेम उपलब्ध है", kn: "ಬಳಕೆದಾರ ಹೆಸರು ಲಭ್ಯವಿದೆ" },
  usernameRule: { en: "3 to 20 letters, numbers or underscore", hi: "3 से 20 अक्षर, अंक या अंडरस्कोर", kn: "3 ರಿಂದ 20 ಅಕ್ಷರ, ಅಂಕೆ ಅಥವಾ ಅಂಡರ್‌ಸ್ಕೋರ್" },
  verifyTitle: { en: "Verify your email", hi: "अपना ईमेल सत्यापित करें", kn: "ನಿಮ್ಮ ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ" },
  verifyBody: { en: "We sent a code to your email. Enter it below.", hi: "हमने आपके ईमेल पर एक कोड भेजा है। नीचे दर्ज करें।", kn: "ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ. ಕೆಳಗೆ ನಮೂದಿಸಿ." },
  verify: { en: "Verify", hi: "सत्यापित करें", kn: "ಪರಿಶೀಲಿಸಿ" },
  resend: { en: "Send the code again", hi: "कोड दोबारा भेजें", kn: "ಕೋಡ್ ಮತ್ತೆ ಕಳುಹಿಸಿ" },
  pendingUploads: { en: "videos waiting to upload", hi: "वीडियो अपलोड के इंतज़ार में", kn: "ವೀಡಿಯೊಗಳು ಅಪ್‌ಲೋಡ್‌ಗೆ ಕಾಯುತ್ತಿವೆ" },
};

const sportNames: Record<string, Record<Lang, string>> = {
  sprint: { en: "Sprint", hi: "दौड़", kn: "ಓಟ" },
  "vertical-jump": { en: "Vertical Jump", hi: "ऊँची कूद", kn: "ಎತ್ತರ ಜಿಗಿತ" },
  "cricket-bowling": { en: "Cricket Bowling", hi: "क्रिकेट गेंदबाज़ी", kn: "ಕ್ರಿಕೆಟ್ ಬೌಲಿಂಗ್" },
  throw: { en: "Throwing", hi: "फेंक", kn: "ಎಸೆತ" },
  "long-jump": { en: "Long Jump", hi: "लंबी कूद", kn: "ಉದ್ದ ಜಿಗಿತ" },
  kabaddi: { en: "Kabaddi", hi: "कबड्डी", kn: "ಕಬಡ್ಡಿ" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string; sport: (slug: string, fallback: string) => string; cat: (name: string) => string };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => k, sport: (_s, f) => f, cat: (c) => c });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved && ["en", "hi", "kn"].includes(saved)) setLangState(saved);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
    document.documentElement.lang = l;
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = (k: string) => extra[k]?.[lang] ?? dict[k]?.[lang] ?? dict[k]?.en ?? extra[k]?.en ?? k;
  const sport = (slug: string, fallback: string) => sportNamesExtra[slug]?.[lang] ?? sportNames[slug]?.[lang] ?? fallback;
  const cat = (name: string) => categories[name]?.[lang] ?? name;
  return <I18nContext.Provider value={{ lang, setLang, t, sport, cat }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
