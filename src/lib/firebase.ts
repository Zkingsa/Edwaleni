import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connectivity Test (Critical Constraint)
async function testConnection() {
  try {
    // Only attempt if we're not using the dummy project
    if (firebaseConfig.projectId !== "dummy-project") {
      await getDocFromServer(doc(db, "test", "connection"));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Firebase is offline. Check configuration.");
    }
  }
}
testConnection();
