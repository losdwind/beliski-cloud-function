import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Counter} from "./distributed_counter";

export const onWriteDislike = functions.firestore
    .document("users/{userID}/branches/{branchID}/dislikes/{dislikeID}")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch dislikes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const dislikes = new Counter(branchRef, "dislikes");
            dislikes.incrementBy(1);
            // increase the userGivenSubs + 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) console.log("Document does not exist!");
            const newUserDislikes = userGivenSubsDoc.data()?.dislikes + 1;

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) console.log("Document does not exist!");
            console.log(userGivenSubsListDoc.data());
            console.log(userGivenSubsListDoc.data()?.dislikes);
            const newUserListDislikes = Array.from(new Set([...userGivenSubsListDoc.data()?.dislikes, snapshot.data().branchID]));
            transaction.update(userGivenSubsRef, {dislikes: newUserDislikes});
            transaction.update(userGivenSubsListRef, {dislikes: newUserListDislikes});

            // TODO: handle the new dislikes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the dislikes may go viral.
            return;
        });
    });

export const onDeleteDislike = functions.firestore
    .document("users/{userID}/branches/{branchID}/dislikes/{dislikeID}")
    .onDelete(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // decrease the branch dislikes  1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const dislikes = new Counter(branchRef, "dislikes");
            dislikes.incrementBy(-1);

            // decrease the userGivenSubs  1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) console.log("Document does not exist!");
            const newUserDislikes = userGivenSubsDoc.data()?.dislikes - 1;

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
            const newUserListDislikes = userGivenSubsListDoc.data()?.dislikes
                .filter((key: string) => key != snapshot.data().branchID);
            transaction.update(userGivenSubsRef, {dislikes: newUserDislikes});
            transaction.update(userGivenSubsListRef, {dislikes: newUserListDislikes});

            // TODO: handle the new dislikes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the dislikes may go viral.
            return;
        });
    });
