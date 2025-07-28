import { FormikValues } from "formik";
import { isEmpty } from 'lodash';
import LocaleString from "./LocaleString";

enum QuestionType {
    INPUT = 'input',
    EMAIL = 'email',
    BUTTON_RADIO = 'buttonRadio',
    BUTTON_MULTI = 'buttonMulti',
    OPINION_SCALE = 'opinionScale',
    PHONE = 'phone',
    ZIP = 'zip',
    MASKED = 'masked',
    CHECKBOX = 'checkbox',
    CHECKBOX_LIST = 'checkboxList',
    HTML = 'html',
    
    // TODO: implment
    DATE = 'date',
    DATE_TIME = 'dateTime',
    NUMERIC = 'numeric',
    WAIVER = 'waiver',
    // VOI
}

enum Width {
  FULL = 100, // fds-layout-grid__cell--span-12 
  TWO_THIRDS = 66, // fds-layout-grid__cell--span-8
  HALF = 50, // fds-layout-grid__cell--span-6
  THIRD = 33, // fds-layout-grid__cell--span-4
}

enum ValidationType {
    MUST_BE = 'mustBe', // (this field must be this value i.e. checkbox)
    REGEX = 'regex',

    MIN_ARRAY = 'minArray',
    MAX_ARRAY = 'maxArray',

    MIN = 'min',
    MAX = 'max',

    MIN_LENGTH = 'minLength',
    MAX_LENGTH = 'maxLength',

    REQUIRED_IF_VALUE_IS = 'requiredIfValueIs', // (this field is required if another field's value is X)
    REQUIRED_IF_VALUE_IS_NOT = 'requiredIfValueIsNot', // (this field is required if another field's value is NOT X)
    REQUIRED_IF_ARRAY_INCLUDES = 'requiredIfArrayIncludes', // (this field is required if another field's array includes X)
    REQUIRED_IF_ANY_VALUE_EXISTS = 'requiredIfAnyValueExists', // (this field is required if another field has any value)
    REQUIRED_IF_NO_VALUE_EXISTS = 'requiredIfNoValueExists', // (this field is required if another field has no value)
}

export type VisibleOption = {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | '===' | '!==' | 'contains' | 'isContained' | 'exists';
    value: any;
}

export type ValidationOption = {
    type: ValidationType;
    siblingField: string;
    testValue: any;
    error: LocaleString;
}

export type AddressPartMap = {
    formatted_address?: string;
    address1?:string;
    address2?:string;
    city?:string;
    state?:string;
    zip?:string;
    country?:string;
}

interface AddressAutocompleteConfig extends google.maps.places.AutocompleteOptions {
    addressPartMap:AddressPartMap;
}

const compare = function (field:any, operator:string, value:any) {
    switch (operator) {
        case '>':   return field > value;
        case '<':   return field < value;
        case '>=':  return field >= value;
        case '<=':  return field <= value;
        case '==':  return field == value;
        case '!=':  return field != value;
        case '===': return field === value;
        case '!==': return field !== value;
        case 'contains': return value.includes(field);
        case 'isContained': {
            if (!Array.isArray(field)) return false;
            return field.includes(value);
        }
        case 'exists':   return !isEmpty(field) || field !== undefined;
    }
}

export default class SurveyQuestion {
    id: string;
    question: LocaleString;
    type: QuestionType;
    visible: boolean | VisibleOption;
    webOrApp: 'both' | 'web' | 'app';
    hint?: LocaleString;
    answers?: LocaleString[];

    // validation
    required: boolean;
    requiredMessage: LocaleString;
    validation?: ValidationOption[];

    className?: string;
    width: Width;

    // input
    placeholder?: LocaleString;
    addressAutocomplete?:boolean;
    addressAutocompleteConfig?:AddressAutocompleteConfig;

    // masked input
    mask?: string;

    // opinionScale
    leftOpinion?: LocaleString;
    rightOpinion?: LocaleString;

    // buttonRadio
    oneAnswerPerLine?: boolean;

    // html
    html?: string;

    public static WIDTH = Width;
    public static TYPE = QuestionType;
    public static VALIDATION_TYPE = ValidationType;

    constructor(q:any) {
        this.id = q.id;
        this.question = new LocaleString(q.question);
        this.type = q.type;

        this.visible = q.visible || true;
        this.webOrApp = q.webOrApp || 'both';

        this.hint = q.hint ? new LocaleString(q.hint) : undefined;
        this.answers = q.answers?.map((answer: any) => new LocaleString(answer));

        this.required = q.required || false;
        this.requiredMessage = new LocaleString(q.requiredMessage || {en: 'Required', es: 'Obligatorio', fr: 'Obligatoire'});
        
        this.validation = q.validation

        this.className = q.className;
        this.width = q.width || Width.FULL;

        // input
        this.placeholder = q.placeholder ? new LocaleString(q.placeholder) : undefined;
        this.addressAutocomplete = q.addressAutocomplete || false;
        this.addressAutocompleteConfig = q.addressAutocompleteConfig || {
            addressPartMap:{
                address1: 'address1',
            },
            componentRestrictions: {
                country: ['us'],
            },
            fields: ['address_components', 'formatted_address']
        };

        this.mask = q.mask;

        // opinionScale
        this.leftOpinion = q.leftOpinion ? new LocaleString(q.leftOpinion) : undefined;
        this.rightOpinion = q.rightOpinion ? new LocaleString(q.rightOpinion) : undefined;

        // buttonRadio
        this.oneAnswerPerLine = q.oneAnswerPerLine;

        // html
        this.html = q.html;
    }

    isVisible = (values:FormikValues):boolean => {
        if (typeof this.visible === 'boolean') {
            return this.visible;
        }
        
        return compare(values[this.visible.field], this.visible.operator, this.visible.value);
    }

    getMaxArray():number|undefined {
        return this.validation?.find(v => v.type === ValidationType.MAX_ARRAY)?.testValue;
    }

    getMax():number|undefined {
        return this.validation?.find(v => v.type === ValidationType.MAX)?.testValue;
    }

    getMaxLength = ():number|undefined => {
        return this.validation?.find(v => v.type === ValidationType.MAX_LENGTH)?.testValue;
    }

    getWidthClass = ():string => {
        switch (this.width) {
            case Width.FULL : return 'fds-layout-grid__cell--span-12'; break;
            case Width.TWO_THIRDS : return 'fds-layout-grid__cell--span-8'; break;
            case Width.HALF : return 'fds-layout-grid__cell--span-6'; break;
            case Width.THIRD : return 'fds-layout-grid__cell--span-4'; break;
        }
    }

    getClassString = ():string => {
        const parsedClasses = [this.getWidthClass()];
        if (this.className) {
            parsedClasses.push(this.className);
        }

        return parsedClasses.join(' ');
    }
}
