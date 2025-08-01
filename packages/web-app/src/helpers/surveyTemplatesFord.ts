import {
  surveyLocalization,
} from "survey-core";
import {
  DefaultFonts,
  QuestionAddedEvent,
  SurveyCreatorModel,
  editorLocalization,
} from "survey-creator-core";
import { registerIcons } from "./fontAwesomeIcons";

import { initThemeFord } from "../themes/surveyJS/ford";
import { FordSurveys } from "../surveyjs_questions";

registerIcons([
  "cars",
  "thumbs-up",
  "people-arrows",
  "genderless",
  "calendar-star",
  "money-check-dollar-pen",
  "chart-bar",
  "calendar-clock",
  "pen-field",
  "car-garage",
]);

export const initSurveyFord = () => {
  // surveyLocalization.supportedLocales = ["en", "es", "fr"];

  // Initialize Ford-specific questions
  FordSurveys.fordInit();

  DefaultFonts.unshift("FordF1");
};

export const initCreatorFord = (creator: SurveyCreatorModel) => {
  initThemeFord(creator);

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__fordCategory"] = "Ford Questions";
  enLocale.toolboxCategories["__0fmc"] = "FMC Questions";

  creator.toolbox.changeCategories([
    { name: "fordvoi", category: "__fordCategory" },
    { name: "fordoptin", category: "__fordCategory" },
    { name: "fordrecommend", category: "__fordCategory" },
    { name: "fordrecommendpost", category: "__fordCategory" },
    { name: "howlikelypurchasingford", category: "__fordCategory" },
    { name: "howlikelypurchasingfordpost", category: "__fordCategory" },
    { name: "sweepstakesOptIn", category: "__fordCategory" },
    // FMC questions
    { name: "gender", category: "__0fmc" },
    { name: "agebracket", category: "__0fmc" },
    { name: "howlikelyacquire", category: "__0fmc" },
    { name: "inmarkettiming", category: "__0fmc" },
    { name: "vehicledrivenmostmake", category: "__0fmc" },
  ]);

  // Apply Ford-specific category sorting - Ford Questions first
  creator.toolbox.categories = creator.toolbox.categories.sort((a: any, b: any) => {
    const getPriority = (name: string) => {
      if (name === "__fordCategory") return 1;
      if (name === "__lincolnCategory") return 2; 
      if (name === "__0pii") return 3;
      if (name === "__0fmc") return 4;
      if (name === "__1wav") return 5;
      if (name.startsWith("__")) return 6;
      return 7;
    };

    return getPriority(a.name) - getPriority(b.name);
  });

  // Open Ford Questions category by default
  creator.toolbox.collapseAllCategories();
  creator.toolbox.expandCategory("__fordCategory");
  creator.toolbox.updateTitles();
};

export const prepareCreatorOnQuestionAddedFord = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  if (options.question.getType() === "fordvoi") {
    options.question.name = "fordVOI";
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

  if (options.question.getType() === "fordoptin") {
    console.log("fordoptin question added");
    options.question.name = "fordEmailOptIn";
    options.question._ffs = "email_opt_in";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en:
        "Please email me communications including product information, offers, and incentives from Ford Motor Company and the local dealer.",
      es: "Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Ford Motor Company y sus concesionarios.",
      fr: "Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Ford Motor Company et de son concessionnaire.",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en:
        "Ford Motor Company respects your privacy and treats your personal information with care. [Click here to read Ford Motor Company's privacy policy.](https://ford.com/help/privacy/)",
      es: "Ford Motor Company respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Ford Motor Company.](https://es.ford.com/help/privacy/)",
      fr: "Ford Motor Company respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Ford Motor Company.](https://ford.com/help/privacy/)",
    });
  }

  if (options.question.getType() === "fordrecommend") {
    console.log("fordrecommend question added");
    options.question.name = "howLikelyRecommend";
    options.question._ffs = "how_likely_recommend";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "How likely are you to recommend Ford to a friend, relative or colleague?",
      es: "¿Qué tan probable es que recomiende Ford a un amigo, familiar o colega?",
      fr: "Quelle est la probabilité que vous recommandiez Ford à un ami, un parent ou un collègue?",
    });
  }

  if (options.question.getType() === "fordrecommendpost") {
    console.log("fordrecommendpost question added");
    options.question.name = "howLikelyRecommend (post event)";
    options.question._ffs = "how_likely_recommend_post";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "Based on your experience today, how likely are you to recommend Ford to a friend, relative or colleague?",
      es: "Basándose en su experiencia de hoy, ¿qué tan probable es que recomiende Ford a un amigo, familiar o colega?",
      fr: "Sur la base de votre expérience d'aujourd'hui, quelle est la probabilité que vous recommandiez Ford à un ami, un parent ou un collègue?",
    });
  }


  if (options.question.getType() === "howlikelypurchasingford") {
    console.log("how_likely_purchasing question added");
    options.question.name = "howLikelyPurchasing";
    options.question._ffs = "how_likely_purchasing_ford";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "For your next vehicle purchase, how likely would you be to consider purchasing a Ford vehicle?",
      es: "¿Cuál es la probabilidad de que se plantee adquirir un Ford la próxima vez que compre un vehículo?",
      fr: "Pour votre prochain achat de véhicule, quelle est la probabilité que vous envisagiez d'acheter un véhicule Ford?"
    });
  }

  if (options.question.getType() === "howlikelypurchasingfordpost") {
    console.log("howlikelypurchasingfordpost question added");
    options.question.name = "howLikelyPurchasing (post event)";
    options.question._ffs = "how_likely_purchasing_ford_post";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "Based on your experience today, how likely would you be to consider purchasing a Ford vehicle?",
      es: "Basándose en su experiencia de hoy, ¿qué tan probable es que considere comprar un vehículo Ford?",
      fr: "Sur la base de votre expérience d'aujourd'hui, quelle est la probabilité que vous envisagiez d'acheter un véhicule Ford?",
    });
  }

};