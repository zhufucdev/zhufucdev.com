import {WithTags} from "./tagging";

const defaultLang = 'zh-CN';

export function getLanguage(tagged: WithTags): string {
    return (tagged.tags.lang ?? defaultLang) as string;
}

export function getLanguageName(tagged: WithTags): string {
    return languageNameOf[getLanguage(tagged)];
}

export const languageNameOf: {[key: string]: string} = {
    "af": "Afrikaans",
    "af-ZA": "Afrikaans (South Africa)",
    "ar": "Arabic",
    "ar-AE": "Arabic (United Arab Emirates)",
    "ar-BH": "Arabic (Bahrain)",
    "ar-DZ": "Arabic (Algeria)",
    "ar-EG": "Arabic (Egypt)",
    "ar-IQ": "Arabic (Iraq)",
    "ar-JO": "Arabic (Jordan)",
    "ar-KW": "Arabic (Kuwait)",
    "ar-LB": "Arabic (Lebanon)",
    "ar-LY": "Arabic (Libya)",
    "ar-MA": "Arabic (Morocco)",
    "ar-OM": "Arabic (Oman)",
    "ar-QA": "Arabic (Qatar)",
    "ar-SA": "Arabic (Saudi Arabia)",
    "ar-SY": "Arabic (Syria)",
    "ar-TN": "Arabic (Tunisia)",
    "ar-YE": "Arabic (Yemen)",
    "az": "Azerbaijani",
    "be": "Belarusian",
    "be-BY": "Belarusian (Belarus)",
    "bg": "Bulgarian",
    "bg-BG": "Bulgarian (Bulgaria)",
    "bs-BA": "Bosnian (Bosnia & Herzegovina)",
    "ca": "Catalan",
    "ca-ES": "Catalan (Spain)",
    "cs": "Czech",
    "cs-CZ": "Czech (Czechia)",
    "cy": "Welsh",
    "cy-GB": "Welsh (United Kingdom)",
    "da": "Danish",
    "da-DK": "Danish (Denmark)",
    "de": "German",
    "de-AT": "Austrian German",
    "de-CH": "Swiss High German",
    "de-DE": "German (Germany)",
    "de-LI": "German (Liechtenstein)",
    "de-LU": "German (Luxembourg)",
    "dv": "Divehi",
    "dv-MV": "Divehi (Maldives)",
    "el": "Greek",
    "el-GR": "Greek (Greece)",
    "en": "English",
    "en-AU": "Australian English",
    "en-BZ": "English (Belize)",
    "en-CA": "Canadian English",
    "en-CB": "English (CB)",
    "en-GB": "British English",
    "en-IE": "English (Ireland)",
    "en-JM": "English (Jamaica)",
    "en-NZ": "English (New Zealand)",
    "en-PH": "English (Philippines)",
    "en-TT": "English (Trinidad & Tobago)",
    "en-US": "American English",
    "en-ZA": "English (South Africa)",
    "en-ZW": "English (Zimbabwe)",
    "eo": "Esperanto",
    "es": "Spanish",
    "es-AR": "Spanish (Argentina)",
    "es-BO": "Spanish (Bolivia)",
    "es-CL": "Spanish (Chile)",
    "es-CO": "Spanish (Colombia)",
    "es-CR": "Spanish (Costa Rica)",
    "es-DO": "Spanish (Dominican Republic)",
    "es-EC": "Spanish (Ecuador)",
    "es-ES": "European Spanish",
    "es-GT": "Spanish (Guatemala)",
    "es-HN": "Spanish (Honduras)",
    "es-MX": "Mexican Spanish",
    "es-NI": "Spanish (Nicaragua)",
    "es-PA": "Spanish (Panama)",
    "es-PE": "Spanish (Peru)",
    "es-PR": "Spanish (Puerto Rico)",
    "es-PY": "Spanish (Paraguay)",
    "es-SV": "Spanish (El Salvador)",
    "es-UY": "Spanish (Uruguay)",
    "es-VE": "Spanish (Venezuela)",
    "et": "Estonian",
    "et-EE": "Estonian (Estonia)",
    "eu": "Basque",
    "eu-ES": "Basque (Spain)",
    "fa": "Persian",
    "fa-IR": "Persian (Iran)",
    "fi": "Finnish",
    "fi-FI": "Finnish (Finland)",
    "fo": "Faroese",
    "fo-FO": "Faroese (Faroe Islands)",
    "fr": "French",
    "fr-BE": "French (Belgium)",
    "fr-CA": "Canadian French",
    "fr-CH": "Swiss French",
    "fr-FR": "French (France)",
    "fr-LU": "French (Luxembourg)",
    "fr-MC": "French (Monaco)",
    "gl": "Galician",
    "gl-ES": "Galician (Spain)",
    "gu": "Gujarati",
    "gu-IN": "Gujarati (India)",
    "he": "Hebrew",
    "he-IL": "Hebrew (Israel)",
    "hi": "Hindi",
    "hi-IN": "Hindi (India)",
    "hr": "Croatian",
    "hr-BA": "Croatian (Bosnia & Herzegovina)",
    "hr-HR": "Croatian (Croatia)",
    "hu": "Hungarian",
    "hu-HU": "Hungarian (Hungary)",
    "hy": "Armenian",
    "hy-AM": "Armenian (Armenia)",
    "id": "Indonesian",
    "id-ID": "Indonesian (Indonesia)",
    "is": "Icelandic",
    "is-IS": "Icelandic (Iceland)",
    "it": "Italian",
    "it-CH": "Italian (Switzerland)",
    "it-IT": "Italian (Italy)",
    "ja": "Japanese",
    "ja-JP": "Japanese (Japan)",
    "ka": "Georgian",
    "ka-GE": "Georgian (Georgia)",
    "kk": "Kazakh",
    "kk-KZ": "Kazakh (Kazakhstan)",
    "kn": "Kannada",
    "kn-IN": "Kannada (India)",
    "ko": "Korean",
    "ko-KR": "Korean (South Korea)",
    "kok": "Konkani",
    "kok-IN": "Konkani (India)",
    "ky": "Kyrgyz",
    "ky-KG": "Kyrgyz (Kyrgyzstan)",
    "lt": "Lithuanian",
    "lt-LT": "Lithuanian (Lithuania)",
    "lv": "Latvian",
    "lv-LV": "Latvian (Latvia)",
    "mi": "Māori",
    "mi-NZ": "Māori (New Zealand)",
    "mk": "Macedonian",
    "mk-MK": "Macedonian (North Macedonia)",
    "mn": "Mongolian",
    "mn-MN": "Mongolian (Mongolia)",
    "mr": "Marathi",
    "mr-IN": "Marathi (India)",
    "ms": "Malay",
    "ms-BN": "Malay (Brunei)",
    "ms-MY": "Malay (Malaysia)",
    "mt": "Maltese",
    "mt-MT": "Maltese (Malta)",
    "nb": "Norwegian Bokmål",
    "nb-NO": "Norwegian Bokmål (Norway)",
    "nl": "Dutch",
    "nl-BE": "Flemish",
    "nl-NL": "Dutch (Netherlands)",
    "nn-NO": "Norwegian Nynorsk (Norway)",
    "ns": "ns",
    "ns-ZA": "ns (South Africa)",
    "pa": "Punjabi",
    "pa-IN": "Punjabi (India)",
    "pl": "Polish",
    "pl-PL": "Polish (Poland)",
    "ps": "Pashto",
    "ps-AR": "Pashto (Argentina)",
    "pt": "Portuguese",
    "pt-BR": "Brazilian Portuguese",
    "pt-PT": "European Portuguese",
    "qu": "Quechua",
    "qu-BO": "Quechua (Bolivia)",
    "qu-EC": "Quechua (Ecuador)",
    "qu-PE": "Quechua (Peru)",
    "ro": "Romanian",
    "ro-RO": "Romanian (Romania)",
    "ru": "Russian",
    "ru-RU": "Russian (Russia)",
    "sa": "Sanskrit",
    "sa-IN": "Sanskrit (India)",
    "se": "Northern Sami",
    "sk": "Slovak",
    "sk-SK": "Slovak (Slovakia)",
    "sl": "Slovenian",
    "sl-SI": "Slovenian (Slovenia)",
    "sq": "Albanian",
    "sq-AL": "Albanian (Albania)",
    "sr-BA": "Serbian (Bosnia & Herzegovina)",
    "sr-SP": "Serbian (SP)",
    "sv": "Swedish",
    "sv-FI": "Swedish (Finland)",
    "sv-SE": "Swedish (Sweden)",
    "sw": "Swahili",
    "sw-KE": "Swahili (Kenya)",
    "syr": "Syriac",
    "syr-SY": "Syriac (Syria)",
    "ta": "Tamil",
    "ta-IN": "Tamil (India)",
    "te": "Telugu",
    "te-IN": "Telugu (India)",
    "th": "Thai",
    "th-TH": "Thai (Thailand)",
    "tl": "Filipino",
    "tl-PH": "Tswana",
    "tn-ZA": "Tswana (South Africa)",
    "tr": "Turkish",
    "tr-TR": "Turkish (Türkiye)",
    "tt": "Tatar",
    "tt-RU": "Tatar (Russia)",
    "ts": "Tsonga",
    "uk": "Ukrainian",
    "uk-UA": "Ukrainian (Ukraine)",
    "ur": "Urdu",
    "ur-PK": "Urdu (Pakistan)",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "vi-VN": "Vietnamese (Vietnam)",
    "xh": "Xhosa",
    "xh-ZA": "Xhosa (South Africa)",
    "zh": "Chinese",
    "zh-CN": "Chinese (China)",
    "zh-HK": "Chinese (Hong Kong SAR China)",
    "zh-MO": "Chinese (Macao SAR China)",
    "zh-SG": "Chinese (Singapore)",
    "zh-TW": "Chinese (Taiwan)",
    "zu": "Zulu",
    "zu-ZA": "Zulu (South Africa)"
}

