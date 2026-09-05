/* ---------------------------------------------------------
   Paste the config object from:
   Firebase Console → Project settings → General →
   "Your apps" → Web app → SDK setup and configuration

   This is NOT a secret to protect like an API key for a paid
   service — it just tells the browser which Firebase project
   to talk to. Access is controlled separately by the
   Authentication providers you enable and (if you add one)
   Firestore security rules.

   REQUIRED one-time setup for the sign-in options on this
   site (Firebase Console → Authentication → Sign-in method):
     1. Enable "Google"        (for the "Continue with Google" button)
     2. Enable "Email/Password" (for username + password login)
     3. Enable "Anonymous"      (for "Continue as Guest")

   Also add your site's domain under Authentication →
   Settings → Authorized domains (localhost is included by
   default; add your Firebase Hosting / custom domain too).
--------------------------------------------------------- */

const firebaseConfig = {
  apiKey: "AIzaSyAlYaA49RM8dQ7hfI_9mcBq97Q33cExiAI",
  authDomain: "lothkunta-lanja.firebaseapp.com",
  projectId: "lothkunta-lanja",
  storageBucket: "lothkunta-lanja.firebasestorage.app",
  messagingSenderId: "924282063292",
  appId: "1:924282063292:web:dc51b26d4460ed1ca903b9",
};

firebase.initializeApp(firebaseConfig);
