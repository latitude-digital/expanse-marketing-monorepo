import React, { useEffect, useState } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { getFirestore, doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import auth from '../services/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import app from '../services/firebase';

import { slk, Model, Question } from "survey-core";
import { VisualizationPanel } from 'survey-analytics';

import { Loader } from "@progress/kendo-react-indicators";

import 'survey-analytics/survey.analytics.min.css';
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'survey-analytics/survey.analytics.tabulator.min.css';

slk(
     "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNS0wNy0xOSwyPTIwMjUtMDctMTksND0yMDI1LTA3LTE5"
);


function ChartsScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const [user, userLoading, userError] = useAuthState(auth);
  const [thisEvent, setThisEvent] = useState<any>();
  const [thisSurvey, setThisSurvey] = useState<Model>();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allAnswers, setAllAnswers] = useState<any[]>();
  const [vizPanel, setVizPanel] = useState<VisualizationPanel>();

  const vizPanelOptions = {
    allowHideQuestions: false
  }

  useEffect(() => {
    console.error(userError);
  }, [userError]);

  const db = getFirestore(app);
  const eventID: string = params.eventID!;

  useEffect(() => {
    if (userLoading) return;

    // see if the user is logged in
    console.log('user', user);

    if (!user) {
      navigate('./login');
    }

    // get the event
    const eventRef = doc(db, "events", eventID);
    getDoc(eventRef).then((doc) => {
      const incomingEvent = doc.data();
      setThisEvent(incomingEvent);

      const surveyJSON = JSON.parse(incomingEvent?.questions);
      const survey = new Model(surveyJSON);
      // setAllQuestions(survey.getAllQuestions());

      setThisSurvey(survey);
      const filteredQuestions:Question[] = incomingEvent?.results?.__questions.map((q:string) => {
        return survey.getQuestionByName(q);
      });
      setAllQuestions(filteredQuestions);

      // get the answers
      const answersRef = collection(db, "events", eventID, "surveys");
      const q = query(answersRef);
      getDocs(q).then((querySnapshot) => {
        const answers: any[] = [];

        querySnapshot.forEach((doc) => {
          answers.push(doc.data());
        });

        setAllAnswers(answers);
      });
    });
  }, [userLoading]);

  useEffect(() => {
    if (!allQuestions || !allAnswers) return;

    const vizPanel = new VisualizationPanel(
      allQuestions,
      allAnswers,
      vizPanelOptions
    );
    setVizPanel(vizPanel);
  }, [thisSurvey, allAnswers]);

  useEffect(() => {
    if (!vizPanel) return;

    vizPanel.render("surveyVizPanel");
    return () => {
      document.getElementById("surveyVizPanel")!.innerHTML = "";
    }
  }, [vizPanel]);

  return (
    <div>
      <h1>{thisSurvey?.title} (Responders: {allAnswers?.length})</h1>

      <div id="surveyVizPanel" />
    </div>
  );
}

export default ChartsScreen;
