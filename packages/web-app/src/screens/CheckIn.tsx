import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import auth from '../services/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import db from '../services/db';
import { ensureCloudFrontAccess, getCloudFrontCookies } from '../services/cloudFrontAuth';
import * as Sentry from "@sentry/react";
import { CollectionReference, Query, DocumentData, DocumentReference, FirestoreDataConverter, collection, query, where, orderBy, updateDoc, Timestamp } from 'firebase/firestore';
import { getApiUrl, ENDPOINTS } from '../config/api';
import { Model } from 'survey-core';
import CloudFrontImage from '../components/CloudFrontImage';

import JSONPretty from 'react-json-pretty';
import { Button, ButtonGroup } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

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
  _email?: string;
  _phone?: string;
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
      _phone: checkUser._phone,
      _sms: checkUser._sms,
      _exported: checkUser._exported,
    };
  },
  fromFirestore(snapshot, options): CheckUser {
    const data = snapshot.data(options);
    // console.log('data', data.first_name, data.last_name, data.email, data.phone);
    // console.log('data', data);

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
      _phone: data._phone,
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
        '_phone',
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

function CheckInScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [checkInMode, setCheckInMode] = useState(true);
  const [thisEvent, setThisEvent] = useState<any>(null);
  const [surveysRef, setSurveysRef] = useState<CollectionReference<CheckUser>>();
  const [surveysQuery, setSurveysQuery] = useState<Query>();
  const [user, userLoading, userError] = useAuthState(auth);
  const [surveys, surveysLoading, surveysError] = useCollectionData(surveysQuery);
  const [gridApi, setGridApi] = useState<GridApi>();
  const [selectedUser, setSelectedUser] = useState<CheckUser | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  // CloudFront authentication is now handled by CloudFrontImage component

  useEffect(() => {
    if (surveysError) console.error(surveysError);
  }, [surveysError]);

  useEffect(() => {
    if (userError) console.error(userError);
  }, [userError]);

  useEffect(() => {
    // console.log('surveysLoading', surveysLoading);
  }, [surveysLoading]);

  useEffect(() => {
    if (userLoading) return;

    // see if the user is logged in
    // console.log('user', user);

    if (!user) {
      navigate('./login');
    } else {
      // Set CloudFront cookies for authenticated user
      ensureCloudFrontAccess()
        .catch(err => {
          console.error('CloudFront access setup failed:', err);
        });
    }

    fetch(getApiUrl(ENDPOINTS.GET_SURVEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventID: params.eventID, preSurveyID: params.preSurveyID }),
    }).then(response => {
      response.json().then((res) => {
        if (res.success) {
          // console.log('got event');
          setSurveysRef(collection(db, `events/${params.eventID}/surveys`).withConverter(checkUserConverter));
          setThisEvent(res.event);

          // Create survey model from questions
          if (res.event.questions) {
            try {
              const surveyJSON = JSON.parse(res.event.questions);
              const survey = new Model(surveyJSON);
              setSurveyModel(survey);
            } catch (error) {
              console.error('Error parsing survey questions:', error);
            }
          }
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
          where('_checkedIn', checkInMode ? '==' : '!=', null),
          where('_checkedOut', '==', null),
          orderBy('last_name'),
          orderBy('first_name')
        ))
        ;
    }
  }, [userLoading, checkInMode, surveysRef]);

  // Custom cell renderer for text with truncation
  const TextCellRenderer = (params: any) => {
    return (
      <div style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: '0 10px',
        lineHeight: '45px'
      }}>
        {params.value}
      </div>
    );
  };

  // Define column definitions for AG Grid
  const getColumnDefs = (): ColDef[] => {
    const baseCols: ColDef[] = [
      {
        field: 'first_name',
        headerName: 'First Name',
        flex: 1,
        minWidth: 120,
        sort: 'asc',
        cellRenderer: TextCellRenderer
      },
      {
        field: 'last_name', 
        headerName: 'Last Name',
        flex: 1,
        minWidth: 120,
        sort: 'asc',
        cellRenderer: TextCellRenderer
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 200,
        valueGetter: (params) => params.data.email || params.data._email || '',
        cellRenderer: TextCellRenderer
      },
      {
        field: 'phone',
        headerName: 'Phone',
        flex: 1,
        minWidth: 120,
        valueGetter: (params) => params.data.phone || params.data._phone || '',
        cellRenderer: TextCellRenderer
      }
    ];

    if (checkInMode) {
      baseCols.push({
        field: 'actions',
        headerName: 'Actions',
        cellRenderer: ActionsCellRenderer,
        width: 150,
        sortable: false,
        filter: false
      });
    } else {
      baseCols.push({
        field: '_checkedIn',
        headerName: 'Checked In',
        flex: 1,
        minWidth: 180,
        valueFormatter: (params) => {
          if (params.value) {
            const date = params.value.toDate ? params.value.toDate() : new Date(params.value);
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          }
          return '';
        }
      });
      baseCols.push({
        field: 'actions',
        headerName: 'Actions',
        cellRenderer: ActionsCellRenderer,
        width: 150,
        sortable: false,
        filter: false
      });
    }

    return baseCols;
  };

  // Custom cell renderer for actions
  const ActionsCellRenderer = (params: any) => {
    const user: CheckUser = params.data;

    const handleCheckInClick = () => {
      setSelectedUser(user);
      setDialogVisible(true);
      const cookies = getCloudFrontCookies();
      console.log('Opening check-in dialog, CloudFront cookies:', cookies);
      // Log each cookie value individually to check for __ suffix
      Object.entries(cookies).forEach(([name, value]) => {
        console.log(`Cookie ${name}: "${value}"`);
        console.log(`Cookie ${name} ends with __:`, value.endsWith('__'));
      });
      
      // For local testing - log what cookies would be sent
      if (window.location.hostname === 'localhost') {
        console.log('\n=== LOCAL TEST MODE ===');
        console.log('In production, these cookies would be sent to CloudFront:');
        const cookieHeader = Object.entries(cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        console.log('Cookie header:', cookieHeader);
      }
    };

    const handleUndoCheckIn = () => {
      updateDoc(user.ref, {
        _checkedIn: null,
      }).then(() => {
        console.log('undo check in');
      }).catch((err: any) => {
        console.error('Undo Check In Error', err);
        Sentry.captureException(err);
      });
    };

    const buttonStyle = {
      height: '32px',
      fontSize: '13px',
      padding: '4px 12px'
    };

    if (checkInMode) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '45px', padding: '0 10px' }}>
          <Button themeColor="primary" onClick={handleCheckInClick} style={buttonStyle}>
            Check In
          </Button>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '45px', padding: '0 10px' }}>
          {user._checkedOut ? (
            <Button themeColor="primary" disabled style={buttonStyle}>
              Already Checked Out
            </Button>
          ) : (
            <Button themeColor="primary" onClick={handleUndoCheckIn} style={buttonStyle}>
              Undo Check In
            </Button>
          )}
        </div>
      );
    }
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  return (
    <>
      <h1 className="text-center my-3 title">Check In {(thisEvent && <> - {thisEvent?.name}</>)}</h1>

      {(userLoading || !thisEvent) && <><br /><br /><p>Loading...</p></>}

      {
        surveys &&
        <div style={{ marginTop: '3em' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' }}>
            <ButtonGroup>
              <Button themeColor={checkInMode ? "primary" : "base"} onClick={() => setCheckInMode(true)}>Check In</Button>
              <Button themeColor={!checkInMode ? "primary" : "base"} onClick={() => setCheckInMode(false)}>View Checked In</Button>
            </ButtonGroup>
            <input
              type="text"
              placeholder="Quick filter..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '300px'
              }}
            />
          </div>
          <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={surveys}
              columnDefs={getColumnDefs()}
              onGridReady={onGridReady}
              quickFilterText={quickFilterText}
              theme="legacy"
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                wrapText: false,
                autoHeight: false
              }}
              rowHeight={45}
              animateRows={true}
              pagination={true}
              paginationPageSize={20}
            />
          </div>
        </div>
      }

      {dialogVisible && selectedUser && (
        <Dialog title="Check In Person?" onClose={() => {
          setDialogVisible(false);
          setSelectedUser(null);
        }}>
          {
            thisEvent?.checkInDisplay ? (
              <ul>
                {
                  Object.entries(thisEvent.checkInDisplay).map(([questionId, displayName]) => {
                    let value = selectedUser[questionId as keyof CheckUser] || selectedUser.otherAnswers?.[questionId];
                    
                    // Get question type from survey model
                    let isImageQuestion = false;
                    if (surveyModel) {
                      const question = surveyModel.getQuestionByName(questionId);
                      if (question) {
                        isImageQuestion = ['file', 'image', 'signaturepad'].includes(question.getType());
                      }
                    }
                    
                    // Handle array values first (for image arrays)
                    if (Array.isArray(value)) {
                      // Check if it's an array of image URLs
                      if (value.length > 0 && typeof value[0] === 'string' && 
                          (value[0].startsWith('http') || value[0].startsWith('data:image'))) {
                        // Use the first image URL
                        value = value[0];
                      } else if (value.length > 0 && isImageQuestion) {
                        // For image questions, check if first element is an object with URL
                        if (value[0] && typeof value[0] === 'object' && value[0].url) {
                          value = value[0].url;
                        } else {
                          value = value[0];
                        }
                      } else {
                        // Join non-image arrays
                        value = value.join(', ');
                      }
                    }
                    
                    // Handle complex object values
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                      // Check if it's an image object with a URL
                      if (value.url && typeof value.url === 'string' && (value.url.startsWith('http') || value.url.startsWith('data:image'))) {
                        value = value.url;
                      } else if (value.content) {
                        // If it's an object with content property, use that
                        value = value.content;
                      } else if (value.name) {
                        value = value.name;
                      } else if (value.type) {
                        // Handle objects with type property (like file uploads)
                        value = `[${value.type}]`;
                      } else {
                        // Convert object to string for display, but make it readable
                        try {
                          value = JSON.stringify(value, null, 2);
                        } catch (e) {
                          value = '[Complex Object]';
                        }
                      }
                    }
                    
                    // Check if it's an image (either by question type or by URL pattern)
                    if (isImageQuestion || (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')))) {
                      return (
                        <li key={questionId}>
                          <strong>{displayName as string}</strong>:
                          <br />
                          <div style={{ marginTop: '8px' }}>
                            <CloudFrontImage
                              src={value}
                              alt={displayName as string}
                              maxHeight={120}
                              maxWidth={200}
                            />
                          </div>
                        </li>
                      );
                    }
                    
                    return (
                      <li key={questionId}>
                        <strong>{displayName as string}</strong>: {value || 'N/A'}
                      </li>
                    );
                  })
                }
              </ul>
            ) : (
              <>
                <p>{selectedUser.first_name} {selectedUser.last_name}</p>
                <JSONPretty id="json-pretty" data={JSON.stringify(selectedUser.otherAnswers)}></JSONPretty>
              </>
            )
          }
          <DialogActionsBar>
            <Button themeColor="warning" onClick={() => {
              setDialogVisible(false);
              setSelectedUser(null);
            }}>Cancel</Button>
            <Button themeColor="success" onClick={() => {
              fetch(getApiUrl(ENDPOINTS.CHECK_IN_OUT_SURVEY), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  eventID: params.eventID,
                  surveyID: selectedUser.id,
                  action: 'checkIn',
                  data: {
                    _checkedIn: new Date().toISOString()
                  }
                }),
              }).then(response => {
                response.json().then((res) => {
                  if (res.success) {
                    // console.log('checked in');
                  } else {
                    console.error('Check In Error', res);
                    Sentry.captureException(new Error(res.message));
                  }
                });
              }).catch((err: any) => {
                console.error('Check In Error', err);
                Sentry.captureException(err);
              });
              setDialogVisible(false);
              setSelectedUser(null);
            }}>Check In</Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </>
  );
}

export default CheckInScreen;
