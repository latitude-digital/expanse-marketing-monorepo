import {
  surveyLocalization,
} from "survey-core";
import {
  DefaultFonts,
  editorLocalization,
  QuestionAddedEvent,
  SurveyCreatorModel,
} from "survey-creator-core";

import { LincolnSurveys } from "meridian-base";

import { registerIcons } from "./fontAwesomeIcons";

import { initThemeLincoln } from "../themes/surveyJS/lincoln";

registerIcons(["cars"]);

export const initSurveyLincoln = () => {
  // surveyLocalization.supportedLocales = ["en", "es", "fr"];

  LincolnSurveys.lincolnInit();

  DefaultFonts.unshift("ProximaNovaRgRegular", "lincolnmillerbblack");
};

export const initCreatorLincoln = (creator: SurveyCreatorModel) => {
  initThemeLincoln(creator);

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__lincolnCategory"] = "Lincoln Questions";

  creator.toolbox.changeCategories([
    { name: "lincolnvoi", category: "__lincolnCategory" },
    { name: "lincolnoptin", category: "__lincolnCategory" },
  ]);
};

export const prepareCreatorOnQuestionAddedLincoln = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  if (options.question.getType() === "lincolnvoi") {
    console.log("lincolnvoi question added");

    options.question.name = "lincolnVOI";
    options.question._ffs = "voi";

    options.question.locTitle.setJson({
      en:
        "I am interested in receiving more information on the following vehicles.",
      es: "Me interesaría recibir más información sobre los siguientes vehículos.",
      fr: "Je suis intéressé à recevoir plus d'informations sur les véhicules suivants.",
    });

    options.question.locDescription.setJson({
      en: "You may select up to three models.",
      es: "Puede seleccionar hasta tres modelos.",
      fr: "Vous pouvez sélectionner jusqu'à trois modèles.",
    });
  }

  if (options.question.getType() === "lincolnoptin") {
    console.log("lincolnoptin question added");
    options.question.name = "lincolnEmailOptIn";
    options.question._ffs = "emailOptIn";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en:
        "Please email me communications, including product and service information, surveys and special offers from Lincoln and its retailers.",
      es: "Por favor, envíenme comunicaciones, incluyendo información sobre productos y servicios, encuestas y ofertas especiales de Lincoln y sus minoristas.",
      fr: "",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en:
        "Lincoln respects your privacy and treats your personal information with care. [Click here to read Lincoln's privacy policy.](https://lincoln.com/help/privacy/)",
      es: "Lincoln respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Lincoln.](https://es.lincoln.com/help/privacy/)",
      fr: "Lincoln respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Lincoln.](https://lincoln.com/help/privacy/)",
    });
  }
};
