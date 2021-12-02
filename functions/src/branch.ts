import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import FieldValue = admin.firestore.FieldValue;

// MARK: create branch
export const onCreateBranch = functions.firestore
    .document("users/{userID}/branches/{branchID}")
    .onCreate(async (snapshot, context) => {
        const serverTimestamp = FieldValue.serverTimestamp();
        const defaultSubscriptionInfo = {
            dateCreated: serverTimestamp,
            likes: 0,
            dislikes: 0,
            comments: 0,
            shares: 0,
            subs: 0,
            rating: 0,
        };
        const newSnapshot = {...snapshot.data(), ...defaultSubscriptionInfo};
        return snapshot.ref.set(newSnapshot);
    });


// // MARK: update branch
// export const onUpdateBranch = functions.firestore
//     .document("users/{userID}/branches/{branchID}")
//     .onUpdate(async (change, context) => {
//         const newValue = change.after.data();
//         const previousValue = change.after.data();
//         if (newValue == previousValue) return;
//     });

// delete branch
export const onDeleteBranch = functions.firestore
    .document("users/{userID}/branches/{branchID}")
    .onDelete(async (snap, context) => {
        const deletedValue = snap.data();
        // eslint-disable-next-line max-len
        if (deletedValue.memberIDs.length == 1 && deletedValue.memberIDs[0] == context.auth?.uid && deletedValue.memberIDs[0] == deletedValue.ownerID) {
            return admin.firestore().recursiveDelete(snap.ref);
        } else return;
    });
