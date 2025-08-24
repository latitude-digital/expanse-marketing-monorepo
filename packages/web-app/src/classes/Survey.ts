import moment from 'moment';
import LocaleString from './LocaleString';

import SurveyQuestion from "./SurveyQuestion";
import SurveyTheme from './SurveyTheme';

type SurveyPage = SurveyQuestion[];

export default class Survey {
    name: LocaleString;
    startDate: Date;
    endDate: Date;
    questions: SurveyPage[];
    theme: SurveyTheme;
    results?: {
        [key: string]: any,
        __questions: string[],
        __totalCount: number,
    };

    thanks: LocaleString;

    constructor(surveyObject:any) {
        this.name = new LocaleString(surveyObject.name);
        // Support both new map field and legacy JSON string
        const questionsData = surveyObject.surveyJSModel || 
                            (surveyObject.questions ? JSON.parse(surveyObject.questions) : {});
        this.questions = questionsData.pages ? 
                        questionsData.pages.map((page: any) => 
                            page.elements ? page.elements.map((question: any) => new SurveyQuestion(question)) : []
                        ) : [];
        this.startDate = moment(surveyObject.startDate).toDate();
        this.endDate = moment(surveyObject.endDate).toDate();
        // Support both new map field and legacy JSON string
        const themeData = surveyObject.surveyJSTheme || 
                         (surveyObject.theme ? JSON.parse(surveyObject.theme) : {});
        this.theme = new SurveyTheme(themeData);
        this.results = surveyObject.results;

        this.thanks = new LocaleString(surveyObject.thanks || 'Thank you for participating.');
    }
}