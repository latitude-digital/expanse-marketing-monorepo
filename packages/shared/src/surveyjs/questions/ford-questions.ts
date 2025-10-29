/**
 * Ford-specific question definitions
 */

import { QuestionConfig } from '../types';

export const fordQuestions: QuestionConfig[] = [
  {
    name: 'fordvoi',
    baseType: 'checkbox',
    title: 'Ford VOI',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'voi',  // Maps to voi field in Ford API
        visible: true,
      },
      {
        name: 'onlyInclude',
        displayName: 'Only Include these vehicle_ids',
        type: 'text',
        category: 'general',
      },
    ],
    defaultValues: {
      title: {
        en: 'I am interested in receiving more information on the following vehicles.',
        es: 'Me interesaría recibir más información sobre los siguientes vehículos.',
        fr: "Je suis intéressé à recevoir plus d'informations sur les véhicules suivants.",
      },
      description: {
        en: "Select up to 3 Ford vehicles you're interested in learning more about.",
        es: 'Seleccione hasta 3 vehículos Ford sobre los que le gustaría obtener más información.',
        fr: 'Sélectionnez jusqu\'à 3 véhicules Ford qui vous intéressent pour en savoir plus.',
      },
      renderAs: 'voi',
      maxSelectedChoices: 3,
      choicesByUrl: {
        url: 'https://cdn.latitudewebservices.com/vehicles/ford.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'fordvehiclesdriven',
    baseType: 'checkbox',
    title: 'Ford Vehicles Driven',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'vehiclesDriven',  // Maps to vehiclesDriven field
        visible: true,
      },
      {
        name: 'onlyInclude',
        displayName: 'Only Include these vehicle_ids',
        type: 'text',
        category: 'general',
      },
    ],
    defaultValues: {
      title: {
        en: 'Which Ford vehicles did you drive today?',
        es: '¿Qué vehículos Ford condujo hoy?',
        fr: 'Quels véhicules Ford avez-vous conduits aujourd\'hui ?',
      },
      renderAs: 'vehiclesdriven',
      choicesByUrl: {
        url: 'https://cdn.latitudewebservices.com/vehicles/ford.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'fordoptin',
    baseType: 'boolean',
    title: 'Ford Opt-In',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'emailOptIn',  // Maps to emailOptIn field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'checkbox',
      isRequired: true,
      defaultValue: true,
      valueTrue: 1,
      valueFalse: 0,
      titleLocation: 'hidden',
      labelTrue: {
        en: 'I am interested in a local Ford dealer calling me concerning product information, offers, and incentives.',
        es: 'Estoy interesado en que un concesionario Ford local me llame sobre información de productos, ofertas e incentivos.',
        fr: 'Je suis intéressé par un concessionnaire Ford local qui m\'appelle concernant les informations sur les produits, les offres et les incitations.',
      },
      description: {
        en: "Our Privacy Pledge\nFor information on how we protect your privacy, please read [our privacy policy](https://ford.com/help/privacy/).",
        es: 'Nuestro Compromiso de Privacidad\nPara obtener información sobre cómo protegemos su privacidad, lea [nuestra política de privacidad](https://es.ford.com/help/privacy/).',
        fr: 'Notre Engagement en matière de Confidentialité\nPour plus d\'informations sur la façon dont nous protégeons votre vie privée, veuillez lire [notre politique de confidentialité](https://ford.com/help/privacy/).',
      },
      descriptionLocation: 'underInput',
    },
  },
  {
    name: 'fordrecommend',
    baseType: 'radiogroup',
    title: 'Ford Recommend',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend',  // Maps to how_likely_recommend field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'How likely are you to recommend Ford to a friend or colleague?',
        es: '¿Qué tan probable es que recomiende Ford a un amigo o colega?',
        fr: 'Quelle est la probabilité que vous recommandiez Ford à un ami ou collègue?',
      },
      choices: [
        { value: 1, text: { en: 'Definitely Will NOT Recommend', es: 'Definitivamente NO recomendaré', fr: 'Je ne recommanderai certainement PAS' } },
        { value: 2, text: { en: 'Probably Will NOT Recommend', es: 'Probablemente NO recomendaré', fr: 'Je ne recommanderai probablement PAS' } },
        { value: 3, text: { en: 'Maybe Will / Maybe Will Not Recommend', es: 'Tal vez recomendaré / Tal vez no recomendaré', fr: 'Peut-être que je recommanderai / Peut-être que je ne recommanderai pas' } },
        { value: 4, text: { en: 'Probably Will Recommend', es: 'Probablemente recomendaré', fr: 'Je recommanderai probablement' } },
        { value: 5, text: { en: 'Definitely Will Recommend', es: 'Definitivamente recomendaré', fr: 'Je recommanderai certainement' } },
      ],
    },
  },
  {
    name: 'fordrecommendpost',
    baseType: 'radiogroup',
    title: 'Ford Recommend Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend_post',  // Maps to how_likely_recommend_post field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'Based on your experience today, how likely are you to recommend Ford to a friend or colleague?',
        es: 'Basándose en su experiencia de hoy, ¿qué tan probable es que recomiende Ford a un amigo o colega?',
        fr: "Sur la base de votre expérience d'aujourd'hui, quelle est la probabilité que vous recommandiez Ford à un ami ou collègue?",
      },
      choices: [
        { value: 1, text: { en: 'Definitely Will NOT Recommend', es: 'Definitivamente NO recomendaré', fr: 'Je ne recommanderai certainement PAS' } },
        { value: 2, text: { en: 'Probably Will NOT Recommend', es: 'Probablemente NO recomendaré', fr: 'Je ne recommanderai probablement PAS' } },
        { value: 3, text: { en: 'Maybe Will / Maybe Will Not Recommend', es: 'Tal vez recomendaré / Tal vez no recomendaré', fr: 'Peut-être que je recommanderai / Peut-être que je ne recommanderai pas' } },
        { value: 4, text: { en: 'Probably Will Recommend', es: 'Probablemente recomendaré', fr: 'Je recommanderai probablement' } },
        { value: 5, text: { en: 'Definitely Will Recommend', es: 'Definitivamente recomendaré', fr: 'Je recommanderai certainement' } },
      ],
    },
  },
  {
    name: 'howlikelypurchasingford',
    baseType: 'radiogroup',
    title: 'How Likely Purchasing Ford',
    defaultValues: {
      renderAs: 'radiobuttongroup',
      title: {
        en: 'How likely are you to consider purchasing a Ford vehicle?',
        es: '¿Qué tan probable es que consideres comprar un vehículo Ford?',
        fr: "Quelle est la probabilité que vous considériez l'achat d'un véhicule Ford?",
      },
      choices: [
        { value: 1, text: { en: 'Definitely Will NOT Consider', es: 'Definitivamente NO consideraré', fr: 'Je ne considérerai certainement PAS' } },
        { value: 2, text: { en: 'Probably Will NOT Consider', es: 'Probablemente NO consideraré', fr: 'Je ne considérerai probablement PAS' } },
        { value: 3, text: { en: 'Maybe Will / Maybe Will NOT Consider', es: 'Tal vez consideraré / Tal vez no consideraré', fr: 'Peut-être que je considérerai / Peut-être que je ne considérerai pas' } },
        { value: 4, text: { en: 'Probably Will Consider', es: 'Probablemente consideraré', fr: 'Je considérerai probablement' } },
        { value: 5, text: { en: 'Definitely Will Consider', es: 'Definitivamente consideraré', fr: 'Je considérerai certainement' } },
      ],
    },
  },
  {
    name: 'howlikelypurchasingfordpost',
    baseType: 'radiogroup',
    title: 'How Likely Purchasing Ford Post',
    defaultValues: {
      renderAs: 'radiobuttongroup',
      title: {
        en: 'After this experience, how likely are you to consider purchasing a Ford vehicle?',
        es: 'Después de esta experiencia, ¿qué tan probable es que consideres comprar un vehículo Ford?',
        fr: "Après cette expérience, quelle est la probabilité que vous considériez l'achat d'un véhicule Ford?",
      },
      choices: [
        { value: 1, text: { en: 'Definitely Will NOT Consider', es: 'Definitivamente NO consideraré', fr: 'Je ne considérerai certainement PAS' } },
        { value: 2, text: { en: 'Probably Will NOT Consider', es: 'Probablemente NO consideraré', fr: 'Je ne considérerai probablement PAS' } },
        { value: 3, text: { en: 'Maybe Will / Maybe Will NOT Consider', es: 'Tal vez consideraré / Tal vez no consideraré', fr: 'Peut-être que je considérerai / Peut-être que je ne considérerai pas' } },
        { value: 4, text: { en: 'Probably Will Consider', es: 'Probablemente consideraré', fr: 'Je considérerai probablement' } },
        { value: 5, text: { en: 'Definitely Will Consider', es: 'Definitivamente consideraré', fr: 'Je considérerai certainement' } },
      ],
    },
  },
  // Brand affinity questions
  {
    name: 'fordpassion',
    baseType: 'rating',
    title: 'Ford Passion',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'custom.passion',
        visible: true,
      },
    ],
    defaultValues: {
      title: 'Ford is a brand that helps me do the things I love.',
      minRateDescription: 'Not at all',
      maxRateDescription: 'Very Much',
    },
  },
  {
    name: 'fordpassionpost',
    baseType: 'rating',
    title: 'Ford Passion Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'custom.passion_post',
        visible: true,
      },
    ],
    defaultValues: {
      title: 'Ford is a brand that helps me do the things I love.',
      minRateDescription: 'Not at all',
      maxRateDescription: 'Very Much',
    },
  },
  {
    name: 'fordcapability',
    baseType: 'rating',
    title: 'Ford Capability',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'custom.capability',
        visible: true,
      },
    ],
    defaultValues: {
      title: 'Ford is a brand that helps me feel capable and confident.',
      minRateDescription: 'Not at all',
      maxRateDescription: 'Very Much',
    },
  },
  {
    name: 'fordcapabilitypost',
    baseType: 'rating',
    title: 'Ford Capability Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'custom.capability_post',
        visible: true,
      },
    ],
    defaultValues: {
      title: 'Ford is a brand that helps me feel capable and confident.',
      minRateDescription: 'Not at all',
      maxRateDescription: 'Very Much',
    },
  },
  // Sweepstakes question - no _ffs value
  {
    // Canonical lowercase
    name: 'sweepstakesoptin',
    baseType: 'radiogroup',
    title: 'Sweepstakes Opt-In',
    defaultValues: {
      renderAs: 'radiobuttongroup',
      title: 'Are you at least 18 years old and would you like to register to win?',
      choices: ['Yes', 'No'],
    },
  },
];
