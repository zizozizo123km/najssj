import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const docRef = doc(db, 'admin_settings', 'api_keys');
  const docSnap = await getDoc(docRef);
  console.log("Firestore Data:", JSON.stringify(docSnap.data(), null, 2));
}
check();
