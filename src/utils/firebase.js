// // Import Firebase functions
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore"; // ✅ Import Firestore
// import { getAuth, signInAnonymously } from "firebase/auth"; // ✅ Import Auth
// import { getAnalytics } from "firebase/analytics";

// // Your Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyARm-7CFPXau3PbK673xG286xqtLp6UZiY",
//     authDomain: "school-exams-e891c.firebaseapp.com",
//     projectId: "school-exams-e891c",
//     storageBucket: "school-exams-e891c.firebasestorage.app",
//     messagingSenderId: "397090503790",
//     appId: "1:397090503790:web:9b160708b716c4f36d7a7f",
//     measurementId: "G-4DXZZXXS91"
//   };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app); // ✅ Correctly initialize Firestore
// const auth = getAuth(app); // ✅ Correctly initialize Auth
// const analytics = getAnalytics(app);

// // Export Firestore & Auth
// export { db, auth , signInAnonymously};


// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARm-7CFPXau3PbK673xG286xqtLp6UZiY",
  authDomain: "school-exams-e891c.firebaseapp.com",
  projectId: "school-exams-e891c",
  storageBucket: "school-exams-e891c.firebasestorage.app",
  messagingSenderId: "397090503790",
  appId: "1:397090503790:web:9b160708b716c4f36d7a7f",
  measurementId: "G-4DXZZXXS91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// ✅ Set persistence for auth
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Firebase auth persistence set to local storage.");
  })
  .catch((error) => {
    console.error("⚠️ Failed to set persistence:", error);
  });

export { db, auth, signInAnonymously };


