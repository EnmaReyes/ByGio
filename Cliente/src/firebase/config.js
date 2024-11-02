import { v4 } from "uuid";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCdTEfEILUTSDIXZU0_AVGRNGZPhc2hDYY",
    authDomain: "bygio-5947c.firebaseapp.com",
    projectId: "bygio-5947c",
    storageBucket: "bygio-5947c.firebasestorage.app",
    messagingSenderId: "518290248257",
    appId: "1:518290248257:web:b244cedb5c3ea334922cc0",
    measurementId: "G-K8QSV2KG7C"
  };

  const app = initializeApp(firebaseConfig);
  export const storage = getStorage(app);
  
  export const UploadImg = async (file) => {
    const storageRef = ref(storage, `blogs_img/${v4()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };