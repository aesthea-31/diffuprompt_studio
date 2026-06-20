import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy
}
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import { firebaseConfig }
    from "./firebase_config.js";


const app = initializeApp(firebaseConfig);


const db = getFirestore(app);


window.db = db;

window.firestore = {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy
};


console.log("Firebase initialized successfully");