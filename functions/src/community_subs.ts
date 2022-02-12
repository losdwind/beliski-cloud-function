import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Counter} from "./distributed_counter";

export const onWriteSub = functions.firestore
    .document("users/{userID}/branches/{branchID}/subs/{subID}")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch subs + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);

            const subs = new Counter(branchRef, "subs");
            subs.incrementBy(1);

            // increase the userGivenSubs + 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) throw "Document does not exist!";
            const newUserSubs = userGivenSubsDoc.data()?.subs + 1;

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            const newUserListSubs = Array.from(new Set([...userGivenSubsListDoc.data()?.subs, snapshot.data().branchID]));
            transaction.update(userGivenSubsRef, {subs: newUserSubs});
            transaction.update(userGivenSubsListRef, {subs: newUserListSubs});

            // TODO: handle the new subs affect the user received Subs to all branch members,
            // possibly using an aggregation function because the subs may go viral.
        });
    });
export const onDeleteSub = functions.firestore
    .document("users/{userID}/branches/{branchID}/subs/{subID}")
    .onDelete(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // decrease the branch subs + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const subs = new Counter(branchRef, "subs");
            subs.incrementBy(-1);

            // decrease the userGivenSubs - 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) throw "Document does not exist!";
            const newUserSubs = userGivenSubsDoc.data()?.subs + 1;

            // remove the branchID from userGivenSubsList collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) console.log("Document does not exist!");
            // the line below will create new list which may remove implicit dependency
            const newUserListSubs = userGivenSubsListDoc.data()?.subs
                .filter((key: string) => key != snapshot.data().branchID);
            transaction.update(userGivenSubsRef, {subs: newUserSubs});
            transaction.update(userGivenSubsListRef, {subs: newUserListSubs});

            // TODO: handle the new subs affect the user received Subs to all branch members,
            // possibly using an aggregation function because the subs may go viral.
        });
    });


