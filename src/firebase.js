// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzF8tiRZOT804gPfNdHUFEbrqigqjS-hU",
  authDomain: "august-copilot-453118-r1.firebaseapp.com",
  projectId: "august-copilot-453118-r1",
  storageBucket: "august-copilot-453118-r1.firebasestorage.app",
  messagingSenderId: "299397748195",
  appId: "1:299397748195:web:02c3cc8671ccd36ce5bcd6",
  measurementId: "G-2736L7HVCX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth, analytics }; 