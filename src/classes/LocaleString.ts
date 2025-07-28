const safeParseJSON = (input:any):any => {
    let ret;
    try {
        ret = JSON.parse(input);
    } catch (e) {
        ret = input;
    }

    return ret;
};

export default class LocaleString {
    en: string;
    es?: string;
    fr?: string;

    public static LANGUAGES = {
        ENGLISH: 'en',
        SPANISH: 'es',
        FRENCH: 'fr',
    };

    constructor(str:any) {
        const parsed = safeParseJSON(str);

        if (typeof parsed === "string") {
            this.en = parsed;
        } else if (typeof parsed === "number") {
            this.en = Number(parsed).toString();
        } else {
            this.en = parsed.en;
            this.es = parsed.es;
            this.fr = parsed.fr;
        }
    }

    public toString = (lang:'en'|'es'|'fr'='en'):string => {
        return this[lang] || `***MISSING ${lang} ${this.en}***`;
    }

    public valueOf = ():string => {
        return this.en;
    }
}
