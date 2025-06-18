// Serviço de notificações dinâmicas (Firestore)
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';

// Buscar notificações (padrão: todas, pode filtrar por usuário futuramente)
export async function fetchNotifications(userId = null) {
  let q = collection(db, 'notificacoes');
  if (userId) {
    q = query(q, where('userId', '==', userId));
  }
  q = query(q, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Marcar notificação como lida
export async function markNotificationAsRead(notificationId) {
  const ref = doc(db, 'notificacoes', notificationId);
  await updateDoc(ref, { lida: true });
} 