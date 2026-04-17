import { auth, db } from '../dbConfig/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export const saveHistoryToFirestore = async (history: any[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  await setDoc(
    doc(db, 'users', user.uid),
    {
      history,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const getHistoryFromFirestore = async (user: any) => {
  if (!user) throw new Error('User not logged in');

  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return [];
  }

  const data = docSnap.data();
  console.log(
    '----------------------------------------------------------',
    data,
  );
  return data?.history || [];
};
