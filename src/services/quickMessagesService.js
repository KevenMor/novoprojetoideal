import { db } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const COLLECTION = 'mensagens_rapidas';

export async function getQuickMessages() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addQuickMessage(data) {
  const ref = await addDoc(collection(db, COLLECTION), data);
  return { id: ref.id, ...data };
}

export async function updateQuickMessage(id, data) {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteQuickMessage(id) {
  await deleteDoc(doc(db, COLLECTION, id));
} 