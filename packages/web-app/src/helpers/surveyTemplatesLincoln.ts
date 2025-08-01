import {
  surveyLocalization,
} from "survey-core";
import {
  DefaultFonts,
  editorLocalization,
  QuestionAddedEvent,
  SurveyCreatorModel,
} from "survey-creator-core";

import { LincolnSurveys } from "../surveyjs_questions";

import { registerIcons } from "./fontAwesomeIcons";

import { initThemeLincoln } from "../themes/surveyJS/lincoln";

registerIcons([
  "cars",
  "thumbs-up",
  "genderless",
  "calendar-star",
  "money-check-dollar-pen",
  "calendar-clock",
  "pen-field",
  "car-garage",
]);

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
    { name: "lincolnoverallopinion", category: "__lincolnCategory" },
    { name: "lincolnoverallopinionpost", category: "__lincolnCategory" },
    // FMC shared questions for Lincoln category
    { name: "gender", category: "__lincolnCategory" },
    { name: "agebracket", category: "__lincolnCategory" },
    { name: "howlikelyacquire", category: "__lincolnCategory" },
    { name: "inmarkettiming", category: "__lincolnCategory" },
    { name: "adultwaiver", category: "__lincolnCategory" },
    { name: "minorwaiver", category: "__lincolnCategory" },
    { name: "vehicledrivenmostmake", category: "__lincolnCategory" },
  ]);

  // Apply Lincoln-specific category sorting - Lincoln Questions first
  creator.toolbox.categories = creator.toolbox.categories.sort((a: any, b: any) => {
    const getPriority = (name: string) => {
      if (name === "__lincolnCategory") return 1;
      if (name === "__fordCategory") return 2;
      if (name === "__0pii") return 3;
      if (name.startsWith("__")) return 4;
      return 5;
    };

    return getPriority(a.name) - getPriority(b.name);
  });

  // Open Lincoln Questions category by default
  creator.toolbox.collapseAllCategories();
  creator.toolbox.expandCategory("__lincolnCategory");
  creator.toolbox.updateTitles();
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
      fr: "Veuillez m'envoyer des communications, y compris des informations sur les produits et services, des enquêtes et des offres spéciales de Lincoln et de ses détaillants.",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en:
        "Lincoln respects your privacy and treats your personal information with care. [Click here to read Lincoln's privacy policy.](https://lincoln.com/help/privacy/)",
      es: "Lincoln respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Lincoln.](https://es.lincoln.com/help/privacy/)",
      fr: "Lincoln respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Lincoln.](https://lincoln.com/help/privacy/)",
    });
  }

  if (options.question.getType() === "lincolnoverallopinion") {
    console.log("lincolnoverallopinion question added");
    options.question.name = "lincolnOverallOpinion";
    options.question._ffs = "overallOpinion";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en:
        "What is your overall opinion or impression of Lincoln?",
      es: "¿Cuál es su opinión o impresión general sobre Lincoln?",
      fr: "Quelle est votre opinion ou impression générale sur Lincoln?",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en:
        "Please click on the response that indicates your preference.",
      es: "Por favor, haga clic en la respuesta que indica su preferencia.",
      fr: "Veuillez cliquer sur la réponse qui indique votre préférence.",
    });
  }

  if (options.question.getType() === "lincolnoverallopinionpost") {
    console.log("lincolnoverallopinionpost question added");
    options.question.name = "lincolnOverallOpinionPost";
    options.question._ffs = "overallOpinionPost";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en:
        "Now that you've experienced a vehicle what is your overall opinion or impression of Lincoln?",
      es: "Ahora que ha experimentado un vehículo, ¿cuál es su opinión o impresión general sobre Lincoln?",
      fr: "Maintenant que vous avez expérimenté un véhicule, quelle est votre opinion ou impression générale sur Lincoln?",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en:
        "Please click on the response that indicates your preference.",
      es: "Por favor, haga clic en la respuesta que indica su preferencia.",
      fr: "Veuillez cliquer sur la réponse qui indique votre préférence.",
    });
  }

  // FMC shared question handlers for Lincoln
  if (options.question.getType() === "gender") {
    console.log("gender question added");
    options.question.name = "gender";
    options.question._ffs = "gender";
    options.question.locTitle.setJson({
      en: "Gender?",
      es: "Sexo",
      fr: "Genre"
    });
  }

  if (options.question.getType() === "agebracket") {
    console.log("age_bracket question added");
    options.question.name = "ageBracket";
    options.question._ffs = "age_bracket";
    options.question.locTitle.setJson({
      en: "May I ask your age?",
      es: "¿Puedo preguntar su edad?",
      fr: "Puis-je vous demander votre âge?"
    });
  }

  if (options.question.getType() === "howlikelyacquire") {
    console.log("how_likely_acquire question added");
    options.question.name = "howLikelyAcquire";
    options.question._ffs = "how_likely_acquire";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "How do you plan to acquire your next vehicle?",
      es: "¿Cómo piensas adquirir tu próximo vehículo?",
      fr: "Comment prévoyez-vous d'acquérir votre prochain véhicule?"
    });
  }

  if (options.question.getType() === "inmarkettiming") {
    console.log("in_market_timing question added");
    options.question.name = "inMarketTiming";
    options.question._ffs = "in_market_timing";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "When do you plan to acquire your next vehicle?",
      es: "¿Cuándo piensas adquirir tu próximo vehículo?",
      fr: "Quand prévoyez-vous d'acheter votre prochain véhicule?"
    });
  }

  if (options.question.getType() === "adultwaiver") {
    options.question.name = "adultWaiver";
    options.question._ffs = "signature";

    options.question.locTitle.setJson({
      en: "Please read and sign the waiver below",
      es: "Por favor, lea y firme el siguiente documento de exoneración de responsabilidad",
      fr: "Veuillez lire et signer le document ci-dessous"
    });
  }

  if (options.question.getType() === "minorwaiver") {
    options.question.name = "minorWaiver";
    options.question._ffs = "minor_signature";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "vehicledrivenmostmake") {
    options.question.name = "vehicleDrivenMostMake";
    options.question._ffs = "vehicle_driven_most_make_id";

    // TODO: validate the spanish/french translations
    options.question.locTitle.setJson({
      en: "What vehicle do you drive most often?",
      es: "¿Qué vehículo conduces con mayor frecuencia?",
      fr: "Quel véhicule conduisez-vous le plus souvent?"
    });
  }
};
