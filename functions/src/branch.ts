import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const defaultSubscriptionInfo = {
    dateCreated: admin.firestore.FieldValue.serverTimestamp(),
    likes: 0,
    dislikes: 0,
    comments: 0,
    shares: 0,
    subs: 0,
    rating: 0,
};

let key: keyof typeof defaultSubscriptionInfo;

// MARK: create branch
export const onCreateBranch = functions.firestore
    .document("users/{userID}/branches/{branchID}")
    .onCreate(async (snapshot, context) => {
        // eslint-disable-next-line guard-for-in
        for (key in defaultSubscriptionInfo) {
            delete snapshot.data()[key];
        }

        const newSnapshot = {...snapshot, ...defaultSubscriptionInfo};
        // return snapshot.ref.set(snapshot);
        return snapshot.ref.create(newSnapshot);
    });


// MARK: update branch
export const onUpdateBranch = functions.firestore
    .document("users/{userID}/branches/{branchID}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.after.data();

        if (newValue == previousValue) {
            return;
        }

        // eslint-disable-next-line guard-for-in
        for (key in defaultSubscriptionInfo) {
            delete newValue[key];
        }
        return change.after.ref.update(newValue);
    });

// delete branch
export const onDeleteBranch = functions.firestore
    .document("users/{userID}/branches/{branchID}")
    .onDelete(async (snap, context) => {
        const deletedValue = snap.data();
        // eslint-disable-next-line max-len
        if (deletedValue.memberIDs.length == 1 && deletedValue.memberIDs[0] == context.auth?.uid && deletedValue.memberIDs[0] == deletedValue.ownerID) {
            return admin.firestore().recursiveDelete(snap.ref);
        }
    });
