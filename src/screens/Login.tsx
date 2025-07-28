// FirebaseUI uses the old version of firebase, so we need to import the compat version of the auth module.
import "firebase/compat/auth";
import firebase from "firebase/compat/app";
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'

// React stuff
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { resetCloudFrontAccess, ensureCloudFrontAccess } from '../services/cloudFrontAuth';

// Auth service
firebase.initializeApp({
  apiKey: "AIzaSyAGX-fDz0xFhlEjuWSEK-2GB6W1R61TIuo",
  authDomain: "latitude-lead-system.firebaseapp.com",
  projectId: "latitude-lead-system",
  storageBucket: "latitude-lead-system.appspot.com",
  messagingSenderId: "846031493147",
  appId: "1:846031493147:web:097f695ea7e214a80b80be",
  measurementId: "G-2NHQNB0M5R"
});

const authForFirebaseUI = firebase.auth()

function SigninScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  if (searchParams.has('logout')) {
    setSearchParams({});
    firebase.auth().signOut().then(() => {
      resetCloudFrontAccess(); // Clear CloudFront cookies
      let newLocation = [...location.pathname.split('/')];
      console.log('newLocation 1', newLocation);
      newLocation.pop()
      console.log('newLocation 2', newLocation);
      newLocation.pop()
      console.log('newLocation 3', newLocation);
      navigate(newLocation.join('/'));
    });
  }
  
  useEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(authForFirebaseUI);
    let signInSuccessUrl = './';
    
    // see if the user is logged in
    const user = firebase.auth().currentUser;
    if (user) {
      // User is signed in.
      console.log('User is signed in');
      console.log(user);
      // Redirect to the home page
      navigate(signInSuccessUrl);
    }

    ui.start('#firebaseui-auth-container', {
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
          // Action if the user is authenticated successfully
          console.log('authResult', authResult);
          console.log('redirectUrl', redirectUrl);
          // Reset and ensure fresh CloudFront cookies after login
          resetCloudFrontAccess();
          ensureCloudFrontAccess().then(() => {
            console.log('CloudFront cookies refreshed after login');
          }).catch(err => {
            console.error('Failed to set CloudFront cookies after login:', err);
          });
          return true;
        },
        uiShown: function () {
          // This is what should happen when the form is full loaded. In this example, I hide the loader element.
          document.getElementById('loader')!.style.display = 'none';
        }
      },
      signInSuccessUrl, // This is where should redirect if the sign in is successful.
      signInOptions: [ // This array contains all the ways an user can authenticate in your application. For this example, is only by email.
        {
          provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          defaultCountry: 'US',
          requireDisplayName: false,
          disableSignUp: {
            status: true
          }
        },
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
          forceSameDevice: false,
          requireDisplayName: false,
          disableSignUp: {
            status: true
          }
        }
      ],
      // tosUrl: 'https://www.example.com/terms-conditions', // URL to you terms and conditions.
      // privacyPolicyUrl: function () { // URL to your privacy policy
      //   window.location.assign('https://www.example.com/privacy-policy');
      // }
    });
  }, []);

  return (
    <>
      <h1 className="text-center my-3 title">Login</h1>
      <div id="firebaseui-auth-container"></div>
      <div id="loader" className="text-center">Loading</div>
    </>
  );
}
export default SigninScreen;
