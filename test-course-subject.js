import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function test() {
  await signInWithEmailAndPassword(auth, "dzs325105@gmail.com", "123456"); // Try to sign in or get user from somewhere?
  console.log("Logged in");
}
test();
