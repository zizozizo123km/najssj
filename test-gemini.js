import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: firebaseConfig.projectId
});
const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);

async function check() {
  const doc = await db.collection("admin_settings").doc("api_keys").get();
  console.log("Firestore Data:", doc.data());
  console.log("ENV Key exists:", !!process.env.GEMINI_API_KEY);
  console.log("ENV Key first 5 chars:", process.env.GEMINI_API_KEY?.substring(0, 5));
}
check();
