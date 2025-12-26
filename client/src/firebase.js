import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfpxHi0h8AfarK-xc0s7zz_LAiOzCAcbU",
  authDomain: "stayontrack-edu.firebaseapp.com",
  projectId: "stayontrack-edu",
  storageBucket: "stayontrack-edu.firebasestorage.app",
  messagingSenderId: "178788966376",
  appId: "1:178788966376:web:8727c4b3a64cf372f40e5d",
  measurementId: "G-Q4336EBWWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
