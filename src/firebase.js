import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB7qVK_tQM9dWAGW87uQh1LmyljYJ4mw1s",
  authDomain: "werewolf-b1b77.firebaseapp.com",
  databaseURL: "https://werewolf-b1b77-default-rtdb.firebaseio.com",
  projectId: "werewolf-b1b77",
  storageBucket: "werewolf-b1b77.firebasestorage.app",
  messagingSenderId: "496058003199",
  appId: "1:496058003199:web:d01b759adfc155d16f66ca"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);