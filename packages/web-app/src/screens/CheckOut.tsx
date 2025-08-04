import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import auth from '../services/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import db from '../services/db';
import { ensureCloudFrontAccess } from '../services/cloudFrontAuth';
import * as Sentry from "@sentry/react";
import { CollectionReference, Query, DocumentData, DocumentReference, FirestoreDataConverter, collection, query, where, orderBy, updateDoc, Timestamp } from 'firebase/firestore';
import { getApiUrl, ENDPOINTS } from '../config/api';

import JSONPretty from 'react-json-pretty';
import {
  ListView,
  ListViewItemProps,
} from "@progress/kendo-react-listview";
import { Avatar } from "@progress/kendo-react-layout";
import { SvgIcon } from "@progress/kendo-react-common";
import { userIcon } from "@progress/kendo-svg-icons";
import { Button, ButtonGroup } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { QRCodeCanvas } from 'qrcode.react';

import _ from 'lodash';

type CheckUser = {
  id: string;
  ref: DocumentReference<DocumentData>;
  surveyDate: Date;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  otherAnswers: any;
  _preSurveyID: string;
  _checkedIn: Date | null;
  _checkedOut: Date | null;
  _claimed: Date | null;
  _used: Date | null;
  _email: any;
  _sms: any;
  _exported: any;
}

const checkUserConverter: FirestoreDataConverter<CheckUser> = {
  toFirestore(checkUser: CheckUser): DocumentData {
    return {
      first_name: checkUser.first_name,
      last_name: checkUser.last_name,
      email: checkUser.email,
      phone: checkUser.phone,
      _preSurveyID: checkUser._preSurveyID,
      _checkedIn: checkUser._checkedIn ? Timestamp.fromDate(checkUser._checkedIn) : null,
      _checkedOut: checkUser._checkedOut ? Timestamp.fromDate(checkUser._checkedOut) : null,
      _claimed: checkUser._claimed ? Timestamp.fromDate(checkUser._claimed) : null,
      _used: checkUser._used ? Timestamp.fromDate(checkUser._used) : null,
      _email: checkUser._email,
      _sms: checkUser._sms,
      _exported: checkUser._exported,
    };
  },
  fromFirestore(snapshot, options): CheckUser {
    const data = snapshot.data(options);
    console.log('data', data.first_name, data.last_name, data.email, data.phone);
    console.log('data', data);

    return {
      id: snapshot.id,
      ref: snapshot.ref,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      surveyDate: data.surveyDate ? (data.surveyDate.toDate ? data.surveyDate.toDate() : new Date(data.surveyDate)) : new Date(),
      _preSurveyID: data._preSurveyID,
      _checkedIn: data._checkedIn ? (data._checkedIn.toDate ? data._checkedIn.toDate() : null) : null,
      _checkedOut: data._checkedOut ? (data._checkedOut.toDate ? data._checkedOut.toDate() : null) : null,
      _claimed: data._claimed ? (data._claimed.toDate ? data._claimed.toDate() : null) : null,
      _used: data._used ? (data._used.toDate ? data._used.toDate() : null) : null,
      _email: data._email,
      _sms: data._sms,
      _exported: data._exported,
      otherAnswers: _.omit(data, [
        'surveyDate',
        'first_name',
        'last_name',
        'email',
        'phone',
        '_preSurveyID',
        '_checkedIn',
        '_checkedOut',
        '_claimed',
        '_used',
        '_email',
        '_sms',
        '_exported',
        'start_time',
        'device_id',
        'event_id',
        'app_version',
        'abandoned',
      ]),
    };
  }
};

function CheckOutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [checkOutMode, setCheckOutMode] = useState(true);
  const [thisEvent, setThisEvent] = useState<any>(null);
  const [surveysRef, setSurveysRef] = useState<CollectionReference<CheckUser>>();
  const [surveysQuery, setSurveysQuery] = useState<Query>();
  const [user, userLoading, userError] = useAuthState(auth);
  const [surveys, surveysLoading, surveysError] = useCollectionData(surveysQuery);
  const [activeQRModal, setActiveQRModal] = useState<string | null>(null);
  const [qrModalUser, setQRModalUser] = useState<CheckUser | null>(null);

  useEffect(() => {
    console.error(surveysError);
  }, [surveysError]);

  useEffect(() => {
    console.error(userError);
  }, [userError]);

  useEffect(() => {
    console.log('surveysLoading', surveysLoading);
  }, [surveysLoading]);

  useEffect(() => {
    if (userLoading) return;

    // see if the user is logged in
    console.log('user', user);

    if (!user) {
      navigate('./login');
    } else {
      // Set CloudFront cookies for authenticated user
      ensureCloudFrontAccess().catch(err => {
        console.error('CloudFront access setup failed:', err);
      });
    }

    fetch(getApiUrl(ENDPOINTS.GET_SURVEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventID: params.eventID }),
    }).then(response => {
      response.json().then((res) => {
        if (res.success) {
          console.log('got event', res.event);
          setThisEvent(res.event);
          
          // Determine which event ID to use for surveys
          // If this is a post-event with a pre-event reference, use the pre-event
          // Otherwise, use the current event ID
          const surveysEventID = res.event._preEventID || params.eventID;
          setSurveysRef(collection(db, `events/${surveysEventID}/surveys`).withConverter(checkUserConverter));

          // do more
        } else {
          // event closed or something, redirect up a directory
          navigate(`../`);
        }
      });
    }).catch(err => {
      Sentry.captureException(err);
      alert(err);
    });
  }, [userLoading, user]);

  useEffect(() => {
    if (!userLoading && surveysRef) {
      setSurveysQuery(
        query(surveysRef,
          where('_checkedOut', checkOutMode ? '==' : '!=', null),
          checkOutMode ? where('_checkedIn', '!=', null) : where('abandoned', '==', 0),
          orderBy('last_name'),
          orderBy('first_name')
        ))
        ;
    }
  }, [userLoading, checkOutMode, surveysRef]);

  const CheckOutRenderer = (props: ListViewItemProps) => {
    const [dialogVisible, setDialogVisible] = useState(false);
    const [isCheckedOut, setIsCheckedOut] = useState(!!props.dataItem._checkedOut);
    const user: CheckUser = props.dataItem;
    const event = thisEvent;

    const performCheckOut = () => {
      // Perform the checkout - always use the pre-event ID where the survey exists
      const checkoutEventID = event._preEventID;
      return fetch(getApiUrl(ENDPOINTS.CHECK_IN_OUT_SURVEY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventID: checkoutEventID, 
          survey: {
            id: user.id,
            _checkedOut: new Date().toISOString(),
          }
        }),
      }).then(response => {
        return response.json().then((res) => {
          if (res.success) {
            console.log('checked out - email will be sent if configured');
            setIsCheckedOut(true);
            return true;
          } else {
            console.error('Check Out Error', res);
            Sentry.captureException(new Error(res.message));
            return false;
          }
        });
      }).catch((err: any) => {
        console.error('Check Out Error', err);
        Sentry.captureException(err);
        return false;
      });
    };

    const handleCheckOutAndShowQR = async () => {
      // Close confirmation dialog and set up QR modal at parent level
      setDialogVisible(false);
      setQRModalUser(user);
      setActiveQRModal(user.id);
      
      // Perform checkout after a short delay to ensure QR dialog is visible
      setTimeout(async () => {
        const success = await performCheckOut();
        if (!success) {
          alert('Check out failed. The person has been marked as checked out, but the email notification may not have been sent.');
        }
      }, 500);
    };

    return (
      <div
        className="k-listview-item row p-2 border-bottom align-middle"
        style={{ margin: 0, display: "flex", backgroundColor: props.index! % 2 ? "#ccc" : "#fff" }}
      >
        <div style={{ flex: 1 }}>
          <Avatar type="icon" themeColor="primary">
            <SvgIcon icon={userIcon} />
          </Avatar>
        </div>
        <div style={{ flex: 6 }}>
          <h2
            style={{ fontSize: 14, color: "#454545", marginBottom: 0 }}
            className="text-uppercase"
          >
            {user.first_name} {user.last_name}
          </h2>
          <div style={{ fontSize: 12, color: "#a0a0a0" }}>{user.email} {user.phone} {user._checkedOut && <>Checked Out: {user._checkedOut?.toLocaleDateString()} {user._checkedOut?.toLocaleTimeString()}</>}</div>
        </div>
        <div style={{ flex: 2 }}>
          {
            checkOutMode ?
              <Button themeColor="primary" onClick={() => setDialogVisible(true)}>Check Out</Button>
              :
              user._used ?
                <Button themeColor="primary" disabled>Already Completed Survey</Button>
                :
                <>
                  <Button themeColor="primary" onClick={() => {
                    setQRModalUser(user);
                    setActiveQRModal(user.id);
                  }}>Show QR</Button>
                  <Button themeColor="base" onClick={() => {
                    updateDoc(user.ref, {
                      _checkedOut: null,
                    }).then(() => {
                      console.log('undo check out');
                      setIsCheckedOut(false);
                    }).catch((err: any) => {
                      console.error('Check Out Error', err);
                      Sentry.captureException(err);
                    });
                  }
                  } style={{ marginLeft: '10px' }}>Undo Check Out</Button>
                </>
          }
        </div>
        {dialogVisible &&
          <Dialog title="Check Out Person?" onClose={() => setDialogVisible(false)}>
            <p>{user.first_name} {user.last_name}</p>
            <JSONPretty id="json-pretty" data={JSON.stringify(user.otherAnswers)}></JSONPretty>
            <DialogActionsBar>
              <Button themeColor="warning" onClick={() => {
                setDialogVisible(false);
              }}>Cancel</Button>
              <Button themeColor="success" onClick={handleCheckOutAndShowQR}>Check Out & Display QR</Button>
            </DialogActionsBar>
          </Dialog>
        }
      </div>
    );
  }

  return (
    <>
      <h1 className="text-center my-3 title">Check Out {(thisEvent && <> - {thisEvent?.name}</>)}</h1>

      {(userLoading || !thisEvent) && <><br /><br /><p>Loading...</p></>}

      {
        surveys &&
        <div style={{ marginTop: '3em' }}>
          <ButtonGroup>
            <Button themeColor={checkOutMode ? "primary" : "base"} onClick={() => setCheckOutMode(true)}>Check Out</Button>
            <Button themeColor={!checkOutMode ? "primary" : "base"} onClick={() => setCheckOutMode(false)}>View Checked Out</Button>
          </ButtonGroup>
          <ListView
            data={surveys}
            item={CheckOutRenderer}
            style={{ width: "100%", marginTop: '1em' }}
          />
        </div>
      }
      
      {activeQRModal && qrModalUser && (
        <Dialog title="Post-Event Survey" onClose={() => {
          setActiveQRModal(null);
          setQRModalUser(null);
        }} width={400}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>{qrModalUser.first_name} {qrModalUser.last_name}</h3>
            <p style={{ marginBottom: '20px' }}>Scan the QR code to complete the post-event survey</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <QRCodeCanvas 
                value={`${window.location.origin}/s/${params.eventID}?pid=${qrModalUser.id}`} 
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all', marginBottom: '20px' }}>
              {`${window.location.origin}/s/${params.eventID}?pid=${qrModalUser.id}`}
            </p>
          </div>
          <DialogActionsBar>
            <Button themeColor="base" onClick={() => {
              setActiveQRModal(null);
              setQRModalUser(null);
            }}>Close</Button>
            <Button themeColor="primary" onClick={() => {
              navigate(`/s/${params.eventID}?pid=${qrModalUser.id}`);
            }}>Go to Survey</Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </>
  );
}

export default CheckOutScreen;
