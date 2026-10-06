import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../../../config/firebase';

const COLLECTION_NAME = 'bloodInventory';

// ========================================
// GET ALL BLOOD INVENTORY
// ========================================

export async function getBloodInventory() {
  const snapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// ========================================
// UPDATE BLOOD STOCK
// ========================================

export async function updateBloodStock(
  id: string,
  availableUnits: number
) {
  const ref = doc(
    db,
    COLLECTION_NAME,
    id
  );

  await updateDoc(ref, {
    availableUnits,
    status:
      availableUnits <= 20
        ? 'Low Stock'
        : 'Normal',
  });
}

// ========================================
// DELETE BLOOD STOCK
// ========================================

export async function deleteBloodStock(
  id: string
) {
  const ref = doc(
    db,
    COLLECTION_NAME,
    id
  );

  await deleteDoc(ref);
}