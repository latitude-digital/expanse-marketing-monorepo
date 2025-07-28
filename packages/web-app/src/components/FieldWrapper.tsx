import { Field, FormikValues } from 'formik';
import React from 'react';
import SurveyQuestion from '../classes/SurveyQuestion';
import ButtonRadio from './ButtonRadio';
import ButtonMulti from './ButtonMulti';
import './FieldWrapper.scss';
import MaskedInput from './MaskedInput';
import OpinionScale from './OpinionScale';
import TextInput from './TextInput';
import Checkbox from './Checkbox';
import CheckboxList from './CheckboxList';
import HTML from './HTML';

type Props = {
    question: SurveyQuestion;
    children?: React.ReactNode;
    values: FormikValues;
};

const FieldWrapper = ({question, values}: Props) => {
    
    return question.isVisible(values) ? (
        <div className={question.getClassString()}>
            {
                question.type === SurveyQuestion.TYPE.INPUT &&
                <Field
                    name={question.id}
                    component={TextInput}
                    question={question}
                />
            }

            {
                question.type === SurveyQuestion.TYPE.PHONE &&
                <Field
                    name={question.id}
                    component={MaskedInput}
                    question={question}
                    mask='000-000-0000'
                    includeLiterals={true}
                />
            }

            {
                question.type === SurveyQuestion.TYPE.ZIP &&
                <Field
                    name={question.id}
                    component={MaskedInput}
                    question={question}
                    mask='00000'
                    includeLiterals={true}
                />
            }

            {
                question.type === SurveyQuestion.TYPE.MASKED &&
                <Field
                    name={question.id}
                    component={MaskedInput}
                    question={question}
                    mask={question.mask}
                />
            }

            {
                question.type === SurveyQuestion.TYPE.EMAIL &&
                <Field
                    name={question.id}
                    component={TextInput}
                    question={question}
                    type="email"
                />
            }

            {
                question.type === SurveyQuestion.TYPE.OPINION_SCALE &&
                <Field
                    name={question.id}
                    component={OpinionScale}
                    question={question}
                />                
            }

            {
                question.type === SurveyQuestion.TYPE.BUTTON_RADIO &&
                <Field
                    name={question.id}
                    component={ButtonRadio}
                    question={question}
                />                
            }

            {
                question.type === SurveyQuestion.TYPE.BUTTON_MULTI &&
                <Field
                    name={question.id}
                    component={ButtonMulti}
                    question={question}
                />                
            }

{
                question.type === SurveyQuestion.TYPE.CHECKBOX &&
                <Field
                    name={question.id}
                    component={Checkbox}
                    question={question}
                />                
            }

            {
                question.type === SurveyQuestion.TYPE.CHECKBOX_LIST &&
                <Field
                    name={question.id}
                    component={CheckboxList}
                    question={question}
                />                
            }

            {
                question.type === SurveyQuestion.TYPE.HTML &&
                <HTML question={question} />
            }
        </div>
    ) : null;
}

export default FieldWrapper;
