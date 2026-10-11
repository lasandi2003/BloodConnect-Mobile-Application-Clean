import {
  doc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../../../config/firebase';

const bloodInventory = [
  {
    id: 'A+',
    bloodGroup: 'A+',
    availableUnits: 120,
    status: 'Normal',
  },
  {
    id: 'A-',
    bloodGroup: 'A-',
    availableUnits: 45,
    status: 'Normal',
  },
  {
    id: 'B+',
    bloodGroup: 'B+',
    availableUnits: 80,
    status: 'Normal',
  },
  {
    id: 'B-',
    bloodGroup: 'B-',
    availableUnits: 30,
    status: 'Normal',
  },
  {
    id: 'AB+',
    bloodGroup: 'AB+',
    availableUnits: 25,
    status: 'Low Stock',
  },
  {
    id: 'AB-',
    bloodGroup: 'AB-',
    availableUnits: 10,
    status: 'Low Stock',
  },
  {
    id: 'O+',
    bloodGroup: 'O+',
    availableUnits: 150,
    status: 'Normal',
  },
  {
    id: 'O-',
    bloodGroup: 'O-',
    availableUnits: 22,
    status: 'Low Stock',
  },
];

export async function seedBloodInventory() {
  const batch = writeBatch(db);

  let createdCount = 0;

  for (const item of bloodInventory) {
    const ref = doc(
      db,
      'bloodInventory',
      item.id
    );

    const existingDocument = await getDoc(ref);

    if (!existingDocument.exists()) {
      batch.set(ref, {
        bloodGroup: item.bloodGroup,
        availableUnits: item.availableUnits,
        status: item.status,
      });

      createdCount++;
    }
  }

  if (createdCount > 0) {
    await batch.commit();

    console.log(
      `${createdCount} blood groups created successfully`
    );
  } else {
    console.log(
      'All blood groups already exist'
    );
  }
}