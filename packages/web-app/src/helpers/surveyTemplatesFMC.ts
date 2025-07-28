import {
  surveyLocalization,
} from "survey-core";
import {
  QuestionAddedEvent,
  SurveyCreatorModel,
  editorLocalization,
} from "survey-creator-core";

export const initSurveyFMC = () => {
  // surveyLocalization.supportedLocales = ["en", "es", "fr"];
};

export const initCreatorFMC = (creator: SurveyCreatorModel) => {
  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__0fmcCagegory"] = "FMC Questions";

  creator.toolbox.changeCategories([
    // { name: "fordvoi", category: "__0fmcCagegory" },
  ]);
};

export const prepareCreatorOnQuestionAddedFMC = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  // if (options.question.getType() === "fordvoi") {
  //   console.log("fordvoi question added");
  //   options.question.name = "_voi";
  //   options.question.titleLocation = "hidden";
  // }
};
