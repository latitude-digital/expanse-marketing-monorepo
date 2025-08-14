import {
  slk,
  surveyLocalization,
  SurveyModel,
} from "survey-core";
import {
  editorLocalization,
  QuestionAddedEvent,
  SurveyCreatorModel,
  SurveyInstanceCreatedEvent,
} from "survey-creator-core";

import { CheckboxVOIQuestion } from "../surveysjs_renderers/FDSRenderers/CheckboxVOI";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/FDSRenderers/RadioButtonButton";
import { SurveyBookeoQuestion } from "../surveysjs_renderers/Bookeo";
import { SurveyQuestionMarkdown } from "../surveysjs_renderers/Markdown";
import { EmailTextInput } from "../surveysjs_renderers/EmailTextInput";
// FDS renderers are now conditionally imported in fdsInitializer.ts

import Showdown from "showdown";
import { registerIcons } from "./fontAwesomeIcons";
import { AllSurveys, FordSurveys, LincolnSurveys } from "../surveyjs_questions";

console.log(
  CheckboxVOIQuestion.name,
  RadioGroupRowQuestion.name,
  SurveyBookeoQuestion.name,
  EmailTextInput.name,
  SurveyQuestionMarkdown.name,
);

const converter = new Showdown.Converter({
  openLinksInNewWindow: true,
});

registerIcons([
  "person-circle-question",
  "person-circle-question",
  "house-circle-check",
  "at",
  "phone",
  // Ford/Lincoln icons
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

export const initSurvey = () => {
  slk(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNi0wNy0xOSwyPTIwMjYtMDctMTksND0yMDI2LTA3LTE5"
  );

  // surveyLocalization.supportedLocales = ["en", "es"];
  
  // Add custom localized string for "(Optional)" text
  // Ensure the locale objects exist before setting properties
  if (!surveyLocalization.locales["en"]) {
    surveyLocalization.locales["en"] = {};
  }
  if (!surveyLocalization.locales["es"]) {
    surveyLocalization.locales["es"] = {};
  }
  if (!surveyLocalization.locales["fr"]) {
    surveyLocalization.locales["fr"] = {};
  }
  
  // Set custom optionalText for our custom renderers
  surveyLocalization.locales["en"]["optionalText"] = " (Optional)";
  surveyLocalization.locales["es"]["optionalText"] = " (Opcional)";
  surveyLocalization.locales["fr"]["optionalText"] = " (Optionnel)";
  
  // NOTE: Only initialize basic survey features here
  // FDS and brand-specific questions are now conditionally loaded in fdsInitializer.ts
  // This ensures admin forms use raw SurveyJS without FDS styling
};

export const initCreator = (creator: SurveyCreatorModel) => {
  creator.toolbox.showCategoryTitles = true;
  creator.toolbox.forceCompact = false;
  creator.toolbox.canCollapseCategories = true;
  creator.toolbox.allowExpandMultipleCategories = true;
  creator.toolbox.keepAllCategoriesExpanded = false;

  const themeTabPlugin = creator.themeEditor;

  // sort the themes so that the custom themes starting with __ are at the top
  if (themeTabPlugin && themeTabPlugin.availableThemes) {
    themeTabPlugin.availableThemes = themeTabPlugin.availableThemes.sort(
      (a: string, b: string) => {
      if (a.startsWith("__") && !b.startsWith("__")) {
        return -1;
      } else if (!a.startsWith("__") && b.startsWith("__")) {
        return 1;
      } else if (a.startsWith("__") && b.startsWith("__")) {
        return a.localeCompare(b); // Sort alphabetically if both start with __
      } else {
        return a.localeCompare(b); // Sort alphabetically if neither starts with __
      }
    }
  );
  }

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__0pii"] = "Personal Information Questions";
  enLocale.toolboxCategories["__0fmc"] = "FMC Questions";
  enLocale.toolboxCategories["__1wav"] = "Waivers";
  enLocale.toolboxCategories["__fordCategory"] = "Ford Questions";
  enLocale.toolboxCategories["__lincolnCategory"] = "Lincoln Questions";

  creator.toolbox.changeCategories([
    { name: "markdown", category: "misc"},
    { name: "optin", category: "choice" },
    { name: "autocompleteaddress", category: "__0pii" },
    { name: "autocompleteaddress2", category: "__0pii" },
    { name: "autocompleteaddresscan", category: "__0pii" },
    { name: "autocompleteaddressall", category: "__0pii" },
    { name: "firstname", category: "__0pii" },
    { name: "lastname", category: "__0pii" },
    { name: "email", category: "__0pii" },
    { name: "phone", category: "__0pii" },
    { name: "adultwaiver", category: "__1wav" },
    { name: "minorwaiver", category: "__1wav" },
    { name: "gender", category: "__0fmc" },
    { name: "agebracket", category: "__0fmc" },
    { name: "howlikelyacquire", category: "__0fmc" },
    { name: "inmarkettiming", category: "__0fmc" },
    { name: "vehicledrivenmostmake", category: "__0fmc" },
    // Note: Ford and Lincoln questions are now assigned dynamically 
    // in their respective brand-specific template files
  ]);

  const md = creator.toolbox.getItemByName("markdown");
  md.tooltip = "Markdown";
  md.setPropertyValue("iconName", "icon-markdown");

  // Add checkbox variant for boolean questions
  const booleanItem = creator.toolbox.getItemByName("boolean");
  if (booleanItem) {
    booleanItem.addSubitem({
      name: "checkboxBoolean",
      title: "Checkbox",
      json: {
        type: "boolean",
        renderAs: "checkbox",
        titleLocation: "hidden"
      }
    });
  }

  // sort the toolbox categories so that the custom categories starting with __ are at the top
  creator.toolbox.categories = creator.toolbox.categories.sort(
    (a: any, b: any) => {
      if (a.name.startsWith("__") && !b.name.startsWith("__")) {
        return -1;
      } else if (!a.name.startsWith("__") && b.name.startsWith("__")) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    }
  );

  // open just the first category
  creator.toolbox.collapseAllCategories();
  creator.toolbox.expandCategory("__0pii");
  creator.toolbox.updateTitles();
};

export const prepareForSurvey = (thisSurvey: SurveyModel, brand?: string) => {
  // add custom css classes
  thisSurvey.onUpdateQuestionCssClasses.add((survey, options) => {
    if (options.question.name === "signature") {
      options.cssClasses.root += " signatureInput";
    }
  });

  // add markdown support
  thisSurvey.onTextMarkdown.add(function (survey, options) {
    //convert the mardown text to html
    var str = converter.makeHtml(options.text);
    //remove root paragraphs <p></p>
    str = str.substring(3);
    str = str.substring(0, str.length - 4);
    //set html
    options.html = str;
  });

  // Log brand-aware preparation
  if (brand) {
    console.log(`Survey prepared for brand: ${brand}`);
  }
};

export const prepareSurveyOnQuestionAdded = (
  creator: SurveyCreatorModel,
  options: SurveyInstanceCreatedEvent
) => {
  console.log('prepareSurveyOnQuestionAdded called, survey questions:', 
    options.survey.getAllQuestions().map(q => ({ name: q.name, type: q.getType() })));
  
  // Function to initialize Google Places on an address input
  const initializeGooglePlaces = (inputElement: HTMLInputElement, survey: any) => {
    // Determine country restrictions based on survey questions
    let countryRestrictions = { country: ["us"] }; // Default to US
    const allQuestions = survey.getAllQuestions();
    
    const parentQuestion = allQuestions.find((q: any) => 
      q.elements && q.elements.some((element: any) => element.name === "address1")
    );
    
    // First check - look for specific question types
    if (parentQuestion) {
      if (parentQuestion.getType() === "autocompleteaddresscan") {
        countryRestrictions = { country: ["ca"] };
      } else if (parentQuestion.getType() === "autocompleteaddressall") {
        countryRestrictions = {}; // No restrictions
      }
    } else {
      // Fallback check - look for Canadian address indicators in the DOM
      const hasProvince = !!document.querySelector('input[aria-label="Province"]') || 
                         !!Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Province'));
      const hasPostalCode = !!document.querySelector('input[aria-label="Postal Code"]') || 
                           !!Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Postal Code'));
      
      if (hasProvince && hasPostalCode) {
        countryRestrictions = { country: ["ca"] };
      }
    }

    const autocomplete = new google.maps.places.Autocomplete(
      inputElement,
      {
        types: ["address"],
        componentRestrictions: countryRestrictions,
        fields: ["address_components", "formatted_address"],
      }
    );

    autocomplete.addListener("place_changed", async function () {
      const place = await autocomplete.getPlace();

      const ParsedData: Record<string, any> = {
        formatted_address: place.formatted_address,
      };

      const postalData = place.address_components?.find((item) =>
        item.types.includes("postal_code")
      );
      const countryData = place.address_components?.find((item) =>
        item.types.includes("country")
      );
      const addressData = place.address_components?.find((item) =>
        item.types.includes("administrative_area_level_1")
      );
      const cityData = place.address_components?.find((item) =>
        item.types.includes("locality")
      );
      const routeData = place.address_components?.find((item) =>
        item.types.includes("route")
      );
      const streetNumberData = place.address_components?.find((item) =>
        item.types.includes("street_number")
      );

      ParsedData.address1 = [
        streetNumberData?.long_name,
        routeData?.long_name,
      ]
        .join(" ")
        .trim();
      ParsedData.city = cityData == null ? "" : cityData.long_name;
      ParsedData.state = addressData == null ? "" : addressData.short_name;
      ParsedData.zip_code = postalData == null ? "" : postalData.long_name;
      ParsedData.country = countryData == null ? "" : countryData.short_name;

      const isComposite = survey.getQuestionByName("address_group");
      if (isComposite) {
        survey.setValue("address_group", ParsedData);
      } else {
        [
          "address1",
          "city",
          "state",
          "zip_code",
          "country",
        ].forEach((key) => {
          try {
            survey.setValue(key, ParsedData[key]);
          } catch (e) {
            console.log("error", e);
          }
        });
      }
    });
  };

  // Use MutationObserver to detect when address inputs are added to the DOM
  const observeAddressInputs = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Look for address1 inputs that have been added
              // Support both Ford UI inputs and standard SurveyJS inputs
              const addressInputs = element.querySelectorAll(
                'input[data-testid="fds-text-address1"], input[aria-label="Street Address"], input[autocomplete="address-line1"]'
              );
              addressInputs.forEach((input) => {
                const inputElement = input as HTMLInputElement;
                
                // Check if Google Places is already initialized (has pac-target-input class)
                if (!inputElement.classList.contains('pac-target-input')) {
                  initializeGooglePlaces(inputElement, options.survey);
                }
              });
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check for existing address inputs that might already be in the DOM
    setTimeout(() => {
      // Support both Ford UI inputs and standard SurveyJS inputs
      const existingAddressInputs = document.querySelectorAll(
        'input[data-testid="fds-text-address1"], input[aria-label="Street Address"], input[autocomplete="address-line1"]'
      );
      existingAddressInputs.forEach((input) => {
        const inputElement = input as HTMLInputElement;
        if (!inputElement.classList.contains('pac-target-input')) {
          initializeGooglePlaces(inputElement, options.survey);
        }
      });
    }, 500); // Small delay to ensure DOM is ready
  };

  // Start observing for address inputs
  observeAddressInputs();

  // Keep the original event handlers for other functionality
  options.survey.onAfterRenderQuestionInput.add((survey, questionOptions) => {
    console.log('onAfterRenderQuestionInput fired for question:', questionOptions.question.name, 
      'type:', questionOptions.question.getType());
  });
};

export const prepareCreatorOnQuestionAdded = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  if (options.question.getType() === "optin") {
    options.question.descriptionLocation = "underInput";
    options.question.label = "I agree";
  }

  if (options.question.getType() === "autocompleteaddress") {
    console.log("autocompleteaddress question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddress2") {
    console.log("autocompleteaddress2 question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddresscan") {
    console.log("autocompleteaddresscan question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddressall") {
    console.log("autocompleteaddressall question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "firstname") {
    console.log("firstname question added");
    options.question.name = "first_name";
    options.question._ffs = "first_name";

    options.question.locTitle.setJson({
      en: "First Name",
      es: "Nombre",
      fr: "Prénom",
    });
  }

  if (options.question.getType() === "lastname") {
    console.log("lastname question added");
    options.question.name = "last_name";
    options.question._ffs = "last_name";

    options.question.locTitle.setJson({
      en: "Last Name",
      es: "Apellidos",
      fr: "Nom de famille",
    });
  }

  if (options.question.getType() === "email") {
    console.log("email question added");
    options.question.name = "email";
    options.question._ffs = "email";

    options.question.locTitle.setJson({
      en: "Email Address",
      es: "Correo electrónico",
      fr: "Email",
    });
  }

  if (options.question.getType() === "phone") {
    console.log("phone question added");
    options.question.name = "phone";
    options.question._ffs = "phone";

    options.question.locTitle.setJson({
      en: "Mobile Number",
      es: "Teléfono",
      fr: "Téléphone",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en: "Standard message and data rates may apply.",
      es: "Pueden aplicar las tarifas normales para mensajes de texto y datos.",
      fr: "Les tarifs standard pour les messages et les données peuvent s'appliquer.",
    });
  }

  // FMC Question handlers - universal for all brands
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

  if (options.question.getType() === "vehicledrivenmostmake") {
    console.log("vehicledrivenmostmake question added");
    options.question.name = "vehicleDrivenMostMake";
    options.question._ffs = "vehicle_driven_most_make_id";

    options.question.locTitle.setJson({
      en: "What is your current vehicle make?",
      es: "¿Cuál es la marca de su vehículo actual?",
      fr: "Quelle est la marque de votre véhicule actuel?"
    });
  }

};
