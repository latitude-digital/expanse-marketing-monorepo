import React, { useEffect, useState } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import auth from '../services/auth';
import { getFirestore, onSnapshot, doc } from "firebase/firestore";

import { useAuthState } from 'react-firebase-hooks/auth';
import app from '../services/firebase';

import { Model, Question } from "survey-core";

import { Loader } from "@progress/kendo-react-indicators";

function ResultsScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const [user, userLoading, userError] = useAuthState(auth);
  const [ thisEvent, setThisEvent ] = useState<any>();
  const [ thisSurvey, setThisSurvey ] = useState<Model>();
  const [ allQuestions, setAllQuestions ] = useState<Question[]>([]);

  useEffect(() => {
    console.error(userError);
  }, [userError]);

  const db = getFirestore(app);
  const eventID:string = params.eventID!;

  useEffect(() => {
    if (userLoading) return;

    // see if the user is logged in
    console.log('user', user);

    if (!user) {
      navigate('./login');
    }

    // listen for stats
    const unsubscribe = onSnapshot(doc(db, "events", eventID), (doc) => {
      const incomingEvent = doc.data();
   
      const surveyJSON = JSON.parse(incomingEvent?.questions);
      const survey = new Model(surveyJSON);
      
      setThisEvent(incomingEvent);
      setThisSurvey(survey);
      setAllQuestions(survey.getAllQuestions());
    });

    // unsubscribe from the listener when unmounting
    return unsubscribe;
  }, [userLoading]);

  return (
    <div>
      <h1>{thisSurvey?.title} (Responders: {thisEvent?.results?.__totalCount})</h1>

      {thisEvent?.results?.__questions.map((q:string) => {
        const thisQuestion = thisSurvey!.getQuestionByName(q);

        return (
          <div key={q}>
            <br/>
            <h2>{thisQuestion.title}</h2>
            {
              Object.keys(thisEvent.results[q]).map((answerKey:string, i) => {
                return (
                  <div key={i} style={{backgroundColor: i%2 ? '#eee':'#fff',display: 'flex', flexDirection: 'row', border: '1px solid', marginBottom: '-1px', maxWidth:'500px' }}>
                    <div style={{flex: 1, padding:'4px'}}><b>{answerKey}</b></div>
                    <div style={{width: '50px', display: 'flex', alignItems:'center', justifyContent:'center', padding:'4px'}}>{Number(thisEvent.results![q][answerKey]).toLocaleString()}</div>
                  </div>
                );
              })
            }
          </div>
        );
      })}
    </div>
  );
}

export default ResultsScreen;
