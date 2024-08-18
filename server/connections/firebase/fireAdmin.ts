require('dotenv').config();

import { initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { initializeApp as initApp, getApp as get_App } from 'firebase/app';
import { getAuth as get_Auth } from 'firebase/auth';

// Admin
var FirebaseAdminApp;
var AdminAuth;

//Reg
var FirebaseApp;
var Auth;

if (!process.env?.ROUTE_COMPILATION) {
  try {
    // Admin
    FirebaseAdminApp = getApp('admin');
    FirebaseApp = get_App('regular');
  } catch (_) {}
  // Disable Connections if compiling routes

  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT,
    storageBucket: process.env.FIREBASE_BUCKET,
    messagingSenderId: process.env.FIREBASE_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
  if (!FirebaseAdminApp) {
    FirebaseAdminApp = initializeApp(firebaseConfig, 'admin');
    AdminAuth = getAuth(FirebaseAdminApp);
  }
  if (!FirebaseApp) {
    FirebaseApp = initApp(firebaseConfig, 'regular');
    Auth = get_Auth(FirebaseApp);
  }
}

export { FirebaseAdminApp, AdminAuth, FirebaseApp, Auth };
