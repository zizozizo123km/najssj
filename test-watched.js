import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function check() {
  try {
    await signInWithEmailAndPassword(auth, "dzs325105@gmail.com", "123456");
    console.log("Signed in");
    const docRef = collection(db, "watched_videos");
    await addDoc(docRef, {
      user_id: auth.currentUser.uid,
      video_id: "test",
      title: "test",
      channel: "test",
      thumbnail: "test",
      created_at: new Date()
    });
    console.log("Added watched video");
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
