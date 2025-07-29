import React, { useEffect, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/i18n/spanish";
import * as SurveyCore from "survey-core";
import * as Sentry from "@sentry/react";
import "survey-core/survey-core.min.css";
import "./Surveys.css";
import { prepareForSurvey } from "../helpers/surveyTemplatesAll";
import { getApiUrl, ENDPOINTS } from '../config/api';
import { extractUTM } from '../utils/surveyUtilities';

import broncoQuizJSON from "./BroncoQuizData.json";
import { BarChart, Bar, XAxis, Cell, LabelList } from 'recharts';
import './BroncoQuiz.scss';

// TypeScript interfaces
interface LocaleTranslations {
  correctAnswersText: string;
  tryAgainText: string;
  howDidYouDo: string;
  comparedToLastQuizzes: string;
  loadingText: string;
  yourAnswer: string;
  correctAnswer: string;
  trueText: string;
  falseText: string;
  noneText: string;
}

interface Translations {
  [key: string]: LocaleTranslations;
}

interface AnswerRange {
  range: string;
  value: number;
  percentage: number;
}

interface QuizRankResponse {
  currentCount?: { [key: string]: number };
}

interface SurveyQuestion {
  name: string;
  title: string;
  value: any;
  correctAnswer: any;
  choices?: Array<{ value: any; text: string }>;
  page: { name: string };
  readOnly: boolean;
  valueName?: string;
  isAnswerCorrect(): boolean;
}

interface SurveyPage {
  name: string;
  questions: SurveyQuestion[];
}

interface BarChartProps {
  data: AnswerRange[];
  userScore: number;
}

SurveyCore.setLicenseKey("NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNS0wMS0wNA==");

const BroncoSurvey: React.FC = () => {
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [last100Quizzes, setLast100Quizzes] = useState<QuizRankResponse>({});
  const [chartLoading, setChartLoading] = useState<boolean>(true);

  const translations: Translations = {
    en: {
      correctAnswersText: "You got {correctAnswers} out of {totalQuestions} correct.",
      tryAgainText: "Click here to try again!",
      howDidYouDo: "How did you do?",
      comparedToLastQuizzes: "Compared to the last 100 quizzes:",
      loadingText: "Calculating...",
      yourAnswer: "Your Answer",
      correctAnswer: "Correct Answer",
      trueText: "True",
      falseText: "False",
      noneText: "None of the above"
    },
    es: {
      correctAnswersText: "Obtuviste {correctAnswers} de {totalQuestions} correctas.",
      tryAgainText: "¡Haz clic aquí para intentarlo de nuevo!",
      howDidYouDo: "¿Cómo te fue?",
      comparedToLastQuizzes: "Comparado con los últimos 100 cuestionarios:",
      loadingText: "Calculando...",
      yourAnswer: "Tu respuesta",
      correctAnswer: "Respuesta correcta",
      trueText: "Verdadero",
      falseText: "Falso",
      noneText: "Ninguna de las anteriores"
    }
  };

  SurveyCore.surveyLocalization.locales["es"].requiredError = "Este campo es obligatorio.";

  const eventID: string = "BroncoQuizDraft";
  const survey = new Model(broncoQuizJSON);
  prepareForSurvey(survey);

  function arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();
    return sortedArr1.every((value, index) => value === sortedArr2[index]);
  }

  function generateResultsHtml(questions: SurveyQuestion[]): string {
    let resultsHtml = "<div class='results-container'>";
    questions.forEach(question => {
      const userAnswer = question.value;
      const correctAnswer = question.correctAnswer;
      const isCorrect = question.isAnswerCorrect();

      let answerHtml = "";

      const getChoiceText = (value: any): string => {
        if (!question.choices) return value === true ? localeTranslations.trueText : value === false ? localeTranslations.falseText : value;
        const choice = question.choices.find(choice => choice.value === value);
        return choice ? choice.text : value;
      };

      if (Array.isArray(userAnswer)) {
        answerHtml = `<ul>${userAnswer.map(answer => {
          const isAnswerCorrect = Array.isArray(userAnswer) ? arraysEqual(userAnswer, correctAnswer) : userAnswer === correctAnswer;
          return `<li class="${isAnswerCorrect ? 'correct' : 'incorrect'}">${userAnswer.includes('none') ? localeTranslations.noneText : getChoiceText(answer)}</li>`;
        }).join("")}</ul>`;
      } else {
        answerHtml = `<span class="${isCorrect ? 'correct' : 'incorrect'}">${getChoiceText(userAnswer)}</span>`;
      }

      resultsHtml += `
        <div class="question-block">
          <p class="question-title">${question.name.slice(8)}. ${question.title}</p>
          <p>${localeTranslations.yourAnswer}: ${answerHtml}</p>
          <p>${localeTranslations.correctAnswer}: <span class="correct">${Array.isArray(correctAnswer) ? `<ul>${correctAnswer.map(answer => `<li class="correct">${getChoiceText(answer)}</li>`).join("")}</ul>` : getChoiceText(correctAnswer)}</span></p>
        </div>`;
    });

    resultsHtml += "</div>";
    return resultsHtml;
  }

  useEffect(() => {
    survey.onCurrentPageChanged.add((sender: Model) => {
      const currentPage = sender.currentPage as SurveyPage;

      if (currentPage.name.startsWith("results")) {
        const pageNumber = currentPage.name.slice(7);
        const previousPageName = `page${pageNumber}`;

        const previousPage = sender.pages.find((page: SurveyPage) => page.name === previousPageName);
        if (!previousPage) return;

        const resultsHtml = generateResultsHtml(previousPage.questions);
        const resultsQuestion = currentPage.getQuestionByName("resultsContent");
        if (resultsQuestion) {
          (resultsQuestion as any).html = resultsHtml;
        }

        previousPage.questions.forEach(question => {
          question.readOnly = true;
        });
      }
    });
  }, [survey]);

  survey.onAfterRenderSurvey.add((sender: Model) => {
    sender.setValue('start_time', new Date());
    sender.setValue('survey_date', new Date());
    sender.setValue('event_id', eventID);
    sender.setValue('app_version', 'surveyjs_1.0');
    sender.setValue('abandoned', 0);
    sender.setValue('_utm', extractUTM());
    sender.setValue('_referrer', (window as any).frames?.top?.document?.referrer);
    sender.setValue('_language', window.navigator?.language);
    sender.setValue('device_id', window.navigator?.userAgent);
    sender.setValue('_screenWidth', window.screen?.width);
    sender.setValue('_offset', new Date().getTimezoneOffset());
    sender.setValue('_timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('defaults set', sender.getValue('survey_date'));
  });

  let language = navigator.language || (navigator as any).userLanguage;
  survey.locale = language.startsWith("es") ? "es" : "en";
  const localeTranslations = translations[survey.locale] || translations["en"];

  useEffect(() => {
    survey.onComplete.add(async (sender: Model, options: any) => {
      const correctAnswers = (sender as any).getCorrectAnswerCount();
      const totalQuestions = sender.getAllQuestions().filter((question: any) => !question.page.name.startsWith("results")).length;
      setCorrectAnswers(correctAnswers);
      setTotalQuestions(totalQuestions);
      setIsComplete(true);

      console.log("Correct Answers:", correctAnswers);
      console.log("Total Questions:", totalQuestions);

      let surveyData: any = sender.data;
      surveyData["_correct_answers"] = correctAnswers;
      surveyData["_total_questions"] = totalQuestions;

      // set some default hidden properties
      surveyData['_preSurveyID'] = null;
      surveyData['_checkedIn'] = null;
      surveyData['_checkedOut'] = null;
      surveyData['_claimed'] = null;
      surveyData['_used'] = null;
      surveyData['_email'] = null;
      surveyData['_sms'] = null;
      surveyData['_exported'] = null;
      surveyData['end_time'] = new Date();
      surveyData['end_time_seconds'] = Math.floor(new Date().getUTCMilliseconds() / 1000);

      sender.getAllQuestions().forEach((question: any) => {
        surveyData[question.valueName || question.name] = (typeof question.value === 'undefined' || question.value === null) ? null : question.value;
      });

      try {
        // Save survey data
        const res = await fetch(getApiUrl(ENDPOINTS.SAVE_SURVEY), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventID, survey: surveyData }),
        });

        if (!res.ok) throw new Error(res.statusText);
        const saveRes = await res.json();
        console.log('Saved to Firestore:', saveRes);

        // Fetch last 100 quizzes
        const last100QuizzesRes = await fetch(`${ENDPOINTS.GET_BRONCO_RANK_BASE}/getBroncoRank?correctAnswers=${correctAnswers}`);
        const lastQuizzes: QuizRankResponse = await last100QuizzesRes.json();
        setLast100Quizzes(lastQuizzes);
        setChartLoading(false);
        options.showDataSavingSuccess();

      } catch (error) {
        console.error('Error:', error);
        Sentry.captureException(error);
        options.showDataSavingError();
      }
      options.showDataSavingSuccess();
    });
  }, [survey]);

  const answerRanges: AnswerRange[] = [
    { range: "0-2", value: 0, percentage: 0 },
    { range: "3-5", value: 0, percentage: 0 },
    { range: "6-8", value: 0, percentage: 0 },
    { range: "9-11", value: 0, percentage: 0 },
    { range: "12-14", value: 0, percentage: 0 },
  ];

  const cleanAnswerData = last100Quizzes?.currentCount
    ? Object.entries(last100Quizzes.currentCount).filter((key) => key !== undefined)
    : [];

  const totalSum = cleanAnswerData.reduce((sum, [key, value]) => sum + value, 0);

  const chartData = cleanAnswerData.reduce((acc, [key, value]) => {
    const score = parseInt(key, 10);

    if (score >= 0 && score <= 2) {
      acc[0].value += value;
    } else if (score >= 3 && score <= 5) {
      acc[1].value += value;
    } else if (score >= 6 && score <= 8) {
      acc[2].value += value;
    } else if (score >= 9 && score <= 11) {
      acc[3].value += value;
    } else if (score >= 12 && score <= 14) {
      acc[4].value += value;
    }

    acc.forEach(item => {
      item.percentage = totalSum > 0 ? Math.round((item.value / totalSum) * 100) : 0;
    });

    return acc;
  }, answerRanges);

  const BarChartWithLabels: React.FC<BarChartProps> = ({ data, userScore }) => {
    let userRange: string;
    if (userScore >= 0 && userScore <= 2) {
      userRange = "0-2";
    } else if (userScore >= 3 && userScore <= 5) {
      userRange = "3-5";
    } else if (userScore >= 6 && userScore <= 8) {
      userRange = "6-8";
    } else if (userScore >= 9 && userScore <= 11) {
      userRange = "9-11";
    } else if (userScore >= 12 && userScore <= 14) {
      userRange = "12-14";
    } else {
      userRange = "";
    }

    return (
      <BarChart width={500} height={320} margin={{ top: 30, right: 20, left: 20, bottom: 20 }} data={data}>
        <XAxis dataKey="range" style={{ fontSize: '18px' }} />
        <Bar dataKey="percentage">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.range === userRange ? "#066FEF" : "#777779"}
            />
          ))}
          <LabelList dataKey="percentage" position="top" formatter={(value: number) => `${value}%`} style={{ fontSize: '18px' }} />
        </Bar>
      </BarChart>
    );
  };

  return (
    <div>
      {!isComplete ? <Survey model={survey} /> : (
        <div className="survey-results">
          {last100Quizzes && chartLoading ? (
            <div className="loading">
              <p>{localeTranslations.loadingText}</p>
            </div>
          ) : (
            <div>
              <p className="header">
                {localeTranslations.correctAnswersText
                  .replace("{correctAnswers}", correctAnswers.toString())
                  .replace("{totalQuestions}", totalQuestions.toString())}
              </p>
              <div className="click_here">
                <a className="link" href={`./bronco?t=${new Date().getTime()}`}>{localeTranslations.tryAgainText}</a>
              </div>
              <p className="how_did_you_do">{localeTranslations.howDidYouDo}</p>
              <p className="compared_to_last_quizzes">{localeTranslations.comparedToLastQuizzes}</p>
              <div className="chart_container">
                <BarChartWithLabels data={chartData || []} userScore={correctAnswers} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BroncoSurvey;