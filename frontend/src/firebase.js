import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  query, 
  where, 
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCnzTOQdLLt6it7wYdYEu7q34WIvbqvIbQ",
  authDomain: "careerflow-ai-9d745.firebaseapp.com",
  projectId: "careerflow-ai-9d745",
  storageBucket: "careerflow-ai-9d745.firebasestorage.app",
  messagingSenderId: "628682292935",
  appId: "1:628682292935:web:d08aed407e8e8abd3e88e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ========== AUTH FUNCTIONS ==========
export const registerUser = async (email, password, name, role) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      name, email, role, createdAt: Timestamp.now()
    });
    return { success: true, user, role };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    return { success: true, user, role: userData?.role, name: userData?.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        resolve({ uid: user.uid, email: user.email, name: userData?.name, role: userData?.role });
      } else {
        resolve(null);
      }
    });
  });
};

export const changePassword = async (oldPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not logged in' };
    
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== JOB FUNCTIONS ==========
export const postJob = async (jobData, hirerId, hirerName) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData, hirerId, hirerName, createdAt: Timestamp.now(), status: 'active'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteJob = async (jobId) => {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToHirerJobs = (hirerId, callback) => {
  const q = query(collection(db, 'jobs'), where('hirerId', '==', hirerId));
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    jobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(jobs);
  });
};

export const listenToJobs = (callback) => {
  const q = query(collection(db, 'jobs'), where('status', '==', 'active'));
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    jobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(jobs);
  });
};

// ========== APPLICATION FUNCTIONS ==========
export const applyForJob = async (applicationData) => {
  try {
    const docRef = await addDoc(collection(db, 'applications'), {
      ...applicationData, appliedAt: Timestamp.now(), status: 'pending'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToApplications = (jobId, callback) => {
  const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    apps.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    callback(apps);
  });
};

export const getApplicationsByCandidate = async (candidateId) => {
  try {
    const q = query(collection(db, 'applications'), where('candidateId', '==', candidateId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const withdrawApplication = async (applicationId) => {
  try {
    await deleteDoc(doc(db, 'applications', applicationId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== PROFILE FUNCTIONS ==========
export const saveCandidateProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, 'candidates', userId), {
      ...profileData, updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCandidateProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'candidates', userId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== SAVED JOBS FUNCTIONS ==========
export const saveJobForLater = async (userId, jobId, jobData) => {
  try {
    const savedRef = doc(db, 'savedJobs', `${userId}_${jobId}`);
    await setDoc(savedRef, { userId, jobId, jobData, savedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSavedJobs = async (userId) => {
  try {
    const q = query(collection(db, 'savedJobs'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const removeSavedJob = async (savedId) => {
  try {
    await deleteDoc(doc(db, 'savedJobs', savedId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== MEETING FUNCTIONS ==========
export const saveMeeting = async (meetingData) => {
  try {
    const docRef = await addDoc(collection(db, 'meetings'), {
      ...meetingData, createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMeetings = async (userId) => {
  try {
    const q = query(collection(db, 'meetings'), where('organizerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

// ========== GET ALL CANDIDATES ==========
export const getAllCandidates = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'candidates'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting candidates:', error);
    return [];
  }
};

// ========== EXPORTS ==========
export { 
  doc, 
  getDoc, 
  Timestamp, 
  query, 
  collection, 
  where, 
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc
};