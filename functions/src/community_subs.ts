import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onWriteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/subs/{subID")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch subs + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newSubs = branchDoc.data()?.subs + 1;
            transaction.update(branchRef, {subs: newSubs});

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
            transaction.update(userGivenSubsRef, {subs: newUserSubs});

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            const newUserListSubs = new Array(new Set([...userGivenSubsListDoc.data()?.subs, snapshot.data().userID]));
            transaction.update(userGivenSubsRef, {subs: newUserListSubs});

            // TODO: handle the new subs affect the user received Subs to all branch members,
            // possibly using an aggregation function because the subs may go viral.
        });
    });
export const onDeleteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/subs/{subID")
    .onDelete(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // decrease the branch subs + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newSubs = branchDoc.data()?.subs - 1;
            transaction.update(branchRef, {subs: newSubs});

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
            transaction.update(userGivenSubsRef, {subs: newUserSubs});

            // remove the branchID from userGivenSubsList collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            // the line below will create new list which may remove implicit dependency
            const newUserListSubs = userGivenSubsListDoc.data()?.subs
                .filter((key: string) => key != snapshot.data().userID);
            // const index = userGivenSubsListDoc.data()?
            // .findIndex((item: any) => item == snapshot.data().userID);
            // if (index > -1) {
            //     userGivenSubsListDoc.data()?.splice(index, 1);
            // }
            transaction.update(userGivenSubsRef, {subs: newUserListSubs});

            // TODO: handle the new subs affect the user received Subs to all branch members,
            // possibly using an aggregation function because the subs may go viral.
        });
    });


