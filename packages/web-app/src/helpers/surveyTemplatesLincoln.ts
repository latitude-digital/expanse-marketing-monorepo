import {
  surveyLocalization,
  ComponentCollection,
} from "survey-core";
import {
  DefaultFonts,
  editorLocalization,
  QuestionAddedEvent,
  SurveyCreatorModel,
} from "survey-creator-core";

import LincolnSurveysNew from "../surveyjs_questions/LincolnSurveysNew";

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
  "road-circle-check",
  "comments",
  "signature",
  "calendar-circle-user",
  "cash-register",
  "person-circle-question",
  "user",
  "mobile-retro",
  "mailbox-flag-up",
  "scale-unbalanced",
  "scale-unbalanced-flip",
  "trophy",
  "envelopes-bulk",
]);

export const initSurveyLincoln = () => {
  // surveyLocalization.supportedLocales = ["en", "es", "fr"];

  // Initialize Lincoln-specific questions using new universal system
  LincolnSurveysNew.lincolnInit();

  DefaultFonts.unshift("ProximaNovaRgRegular", "lincolnmillerbblack");
};

export const initCreatorLincoln = (creator: SurveyCreatorModel) => {
  initThemeLincoln(creator);

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__lincolnCategory"] = "Lincoln Questions";
  enLocale.toolboxCategories["__0fmc"] = "FMC Questions";

  // Manually add Lincoln questions to the toolbox if they're not already there
  // This is needed because questions registered via the universal system after
  // Creator instantiation don't automatically appear in the toolbox

  // Map question names to proper titles and icons
  const lincolnQuestionConfig: Record<string, { title: string; icon: string }> = {
    lincolnvoi: { title: "Lincoln VOI", icon: "icon-cars" },
    lincolnvehiclesdriven: { title: "Lincoln Vehicles Driven", icon: "icon-road-circle-check" },
    lincolnoptin: { title: "Lincoln Opt-in", icon: "icon-envelopes-bulk" },
    lincolnrecommend: { title: "Lincoln Recommend", icon: "icon-comments" },
    lincolnrecommendpost: { title: "Lincoln Recommend Post", icon: "icon-comments" },
    lincolnoverallopinion: { title: "Lincoln Overall Opinion", icon: "icon-rating" },
    lincolnoverallopinionpost: { title: "Lincoln Overall Opinion Post", icon: "icon-rating" },
    lincolnpurchaseconsideration: { title: "Lincoln Purchase Consideration", icon: "icon-scale-unbalanced" },
    lincolnpurchaseconsiderationpost: { title: "Lincoln Purchase Consideration Post", icon: "icon-scale-unbalanced-flip" },
  };

  // First, ensure Lincoln questions exist in the toolbox
  // The questions should already be registered via LincolnSurveysNew.lincolnInit()
  const lincolnQuestions = Object.keys(lincolnQuestionConfig);

  // Check if Lincoln questions exist and assign them to the category
  const categoriesToChange = [];
  lincolnQuestions.forEach(questionName => {
    let item = creator.toolbox.getItemByName(questionName);
    if (!item) {
      // Question not in toolbox, manually add it
      // The questions are registered in ComponentCollection but not automatically added to toolbox
      const config = lincolnQuestionConfig[questionName];
      creator.toolbox.addItem({
        name: questionName,
        title: config.title,
        iconName: config.icon,
        json: { type: questionName },
        category: "__lincolnCategory"
      });
      console.log(`Manually added Lincoln question '${questionName}' to toolbox`);
    } else {
      categoriesToChange.push({ name: questionName, category: "__lincolnCategory" });
    }
  });

  // Also reassign FMC questions to their category
  const fmcQuestions = ["gender", "agebracket", "howlikelyacquire", "inmarkettiming", "vehicledrivenmostmake"];
  fmcQuestions.forEach(questionName => {
    const item = creator.toolbox.getItemByName(questionName);
    if (item) {
      categoriesToChange.push({ name: questionName, category: "__0fmc" });
    }
  });

  if (categoriesToChange.length > 0) {
    creator.toolbox.changeCategories(categoriesToChange);
  } else {
    console.error("No Lincoln questions found in toolbox to categorize!");
  }

  // Apply Lincoln-specific category sorting - Personal Info first, then FMC, then Lincoln
  creator.toolbox.categories = creator.toolbox.categories.sort((a: any, b: any) => {
    const getPriority = (name: string) => {
      if (name === "__0pii") return 1;  // Personal Information Questions
      if (name === "__0fmc") return 2;  // FMC Questions  
      if (name === "__lincolnCategory") return 3;  // Lincoln Questions
      if (name === "__fordCategory") return 4;  // Ford Questions (if present)
      if (name === "__1wav") return 5;
      if (name.startsWith("__")) return 6;
      return 7;
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
        "Please email me communications including product information, offers, and incentives from Lincoln and the local retailer.",
      es: "Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Lincoln y sus minoristas.",
      fr: "Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Lincoln et de son détaillant.",
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
    options.question._ffs = "impression";
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

  if (options.question.getType() === "lincolnrecommend") {
    console.log("lincolnrecommend question added");
    options.question.name = "howLikelyRecommend";
    options.question._ffs = "how_likely_recommend";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "How likely are you to recommend Lincoln to a friend, relative or colleague?",
      es: "¿Qué tan probable es que recomiende Lincoln a un amigo, familiar o colega?",
      fr: "Quelle est la probabilité que vous recommandiez Lincoln à un ami, un parent ou un collègue?",
    });
  }

  if (options.question.getType() === "lincolnrecommendpost") {
    console.log("lincolnrecommendpost question added");
    options.question.name = "howLikelyRecommend (post event)";
    options.question._ffs = "how_likely_recommend_post";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "Based on your experience today, how likely are you to recommend Lincoln to a friend, relative or colleague?",
      es: "Basándose en su experiencia de hoy, ¿qué tan probable es que recomiende Lincoln a un amigo, familiar o colega?",
      fr: "Sur la base de votre expérience d'aujourd'hui, quelle est la probabilité que vous recommandiez Lincoln à un ami, un parent ou un collègue?",
    });
  }

  if (options.question.getType() === "lincolnoverallopinionpost") {
    console.log("lincolnoverallopinionpost question added");
    options.question.name = "lincolnOverallOpinionPost";
    options.question._ffs = "impression_post";
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

  if (options.question.getType() === "lincolnpurchaseconsideration") {
    console.log("lincolnpurchaseconsideration question added");
    options.question.name = "lincolnPurchaseConsideration";
    options.question._ffs = "how_likely_purchasing";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "For your next vehicle, how likely would you be to consider a Lincoln?",
      es: "Para su próximo vehículo, ¿qué tan probable es que considere un Lincoln?",
      fr: "Pour votre prochain véhicule, quelle est la probabilité que vous considériez un Lincoln?",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en: "Please click on the response that indicates your preference.",
      es: "Por favor, haga clic en la respuesta que indica su preferencia.",
      fr: "Veuillez cliquer sur la réponse qui indique votre préférence.",
    });
  }

  if (options.question.getType() === "lincolnpurchaseconsiderationpost") {
    console.log("lincolnpurchaseconsiderationpost question added");
    options.question.name = "lincolnPurchaseConsiderationPost";
    options.question._ffs = "how_likely_purchasing_post";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "Based on your test-drive experience, how likely would you be to consider purchasing a vehicle from Lincoln?",
      es: "Basándose en su experiencia de prueba de manejo, ¿qué tan probable es que considere comprar un vehículo de Lincoln?",
      fr: "Sur la base de votre expérience d'essai routier, quelle est la probabilité que vous considériez l'achat d'un véhicule Lincoln?",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en: "Please click on the response that indicates your preference.",
      es: "Por favor, haga clic en la respuesta que indica su preferencia.",
      fr: "Veuillez cliquer sur la réponse qui indique votre préférence.",
    });
  }

};
