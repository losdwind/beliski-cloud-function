import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onCreateBranch = functions.firestore
  .document("users/{userID}/branches/{branchID}")
  .onCreate(async (snapshot, context) => {
    const subscription = {
      dateCreated: admin.firestore.FieldValue.serverTimestamp(),
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      subs: 0,
      rating: 0,
    };
    const newSnapshot = { ...snapshot, ...subscription };
    return snapshot.ref.set(newSnapshot);
  });

export const onUpdateBranch = functions.firestore
  .document("users/{userID}/branches/{branchID}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.after.data();
  });
