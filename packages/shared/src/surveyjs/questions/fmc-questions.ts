/**
 * FMC (Ford Motor Company) shared question definitions
 * Used by both Ford and Lincoln brands
 */

import { QuestionConfig } from '../types';

export const fmcQuestions: QuestionConfig[] = [
  // Personal information questions
  {
    name: 'firstname',
    baseType: 'text',
    title: 'First Name',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'firstName',  // Maps to firstName field
        visible: false,
      },
    ],
  },
  {
    name: 'lastname',
    baseType: 'text',
    title: 'Last Name',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'lastName',  // Maps to lastName field
        visible: false,
      },
    ],
  },
  {
    name: 'phone',
    baseType: 'text',
    title: 'Phone',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'phone',  // Maps to phone field
        visible: false,
      },
    ],
  },
  {
    name: 'email',
    baseType: 'text',
    title: 'Email',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'email',  // Maps to email field
        visible: false,
      },
    ],
  },
  // Address questions
  {
    name: 'autocompleteaddress',
    baseType: 'text',
    title: 'Address',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'address',  // Maps to address field
        visible: false,
      },
    ],
  },
  {
    name: 'autocompleteaddressall',
    baseType: 'text',
    title: 'Full Address',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'fullAddress',  // Maps to fullAddress field
        visible: false,
      },
    ],
  },
  // Age bracket questions - no _ffs values
  {
    name: 'agegroup',
    baseType: 'radiogroup',
    title: 'Age Group',
  },
  {
    name: 'agebracket',
    baseType: 'radiogroup',
    title: 'Age Bracket',
  },
  // Gender questions - no _ffs values
  {
    name: 'genderchoice',
    baseType: 'radiogroup',
    title: 'Gender Choice',
  },
  {
    name: 'gender',
    baseType: 'radiogroup',
    title: 'Gender',
  },
  // Ethnicity - no _ffs value
  {
    name: 'ethnicityselect',
    baseType: 'checkbox',
    title: 'Ethnicity Select',
  },
  // Income - no _ffs value
  {
    name: 'incomelevel',
    baseType: 'radiogroup',
    title: 'Income Level',
  },
  // Waiver questions - no _ffs values
  {
    name: 'waiver',
    baseType: 'panel',
    title: 'Waiver',
  },
  {
    name: 'adultwaiver',
    baseType: 'panel',
    title: 'Adult Waiver',
  },
  {
    name: 'minorwaiver',
    baseType: 'panel',
    title: 'Minor Waiver',
  },
];