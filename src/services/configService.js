import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CONFIG_DOC_ID = 'global'; // Pode ser por tenant/org se necessário

export async function getConfig() {
  const ref = doc(db, 'configuracoes', CONFIG_DOC_ID);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

export async function saveConfig(data) {
  const ref = doc(db, 'configuracoes', CONFIG_DOC_ID);
  await setDoc(ref, data, { merge: true });
} 