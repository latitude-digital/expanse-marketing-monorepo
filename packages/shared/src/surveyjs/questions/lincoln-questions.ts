/**
 * Lincoln-specific question definitions
 */

import { QuestionConfig } from '../types';

export const lincolnQuestions: QuestionConfig[] = [
  {
    name: 'lincolnvoi',
    baseType: 'checkbox',
    title: 'Lincoln VOI',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'voi',  // Maps to voi field in Lincoln API
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
      renderAs: 'voi',
      maxSelectedChoices: 3,
      choicesByUrl: {
        url: 'https://cdn.latitudewebservices.com/vehicles/lincoln.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'lincolnvehiclesdriven',
    baseType: 'checkbox',
    title: 'Lincoln Vehicles Driven',
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
      renderAs: 'vehiclesdriven',
      choicesByUrl: {
        url: 'https://cdn.latitudewebservices.com/vehicles/lincoln.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'lincolnoptin',
    baseType: 'radiogroup',
    title: 'Lincoln Opt-In',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'emailOptIn',  // Maps to emailOptIn field
        visible: true,
      },
    ],
  },
  {
    name: 'lincolnoverallopinion',
    baseType: 'radiogroup',
    title: 'Lincoln Overall Opinion',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'impression',  // Maps to impression field
        visible: true,
      },
    ],
  },
  {
    name: 'lincolnoverallopinionpost',
    baseType: 'radiogroup',
    title: 'Lincoln Overall Opinion Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'impression_post',  // Maps to impression_post field
        visible: true,
      },
    ],
  },
  {
    name: 'lincolnrecommend',
    baseType: 'radiogroup',
    title: 'Lincoln Recommend',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend',  // Maps to how_likely_recommend field
        visible: true,
      },
    ],
  },
  {
    name: 'lincolnrecommendpost',
    baseType: 'radiogroup',
    title: 'Lincoln Recommend Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend_post',  // Maps to how_likely_recommend_post field
        visible: true,
      },
    ],
  },
  {
    name: 'lincolnpurchaseconsideration',
    baseType: 'radiogroup',
    title: 'Lincoln Purchase Consideration',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_purchasing',  // Maps to how_likely_purchasing field
        visible: true,
      },
    ],
  },
  {
    name: 'lincolnpurchaseconsiderationpost',
    baseType: 'radiogroup',
    title: 'Lincoln Purchase Consideration Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_purchasing_post',  // Maps to how_likely_purchasing_post field
        visible: true,
      },
    ],
  },
];
