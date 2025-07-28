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
        this.questions = JSON.parse(surveyObject.questions).map((pages: any[]) => pages.map((question: any) => new SurveyQuestion(question)));
        this.startDate = moment(surveyObject.startDate).toDate();
        this.endDate = moment(surveyObject.endDate).toDate();
        this.theme = new SurveyTheme(JSON.parse(surveyObject.theme));
        this.results = surveyObject.results;

        this.thanks = new LocaleString(surveyObject.thanks || 'Thank you for participating.');
    }
}