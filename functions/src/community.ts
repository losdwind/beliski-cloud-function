import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onWriteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/likes/{likeID")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch likes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newLikes = branchDoc.data()?.likes + 1;
            transaction.update(branchRef, {likes: newLikes});

            // add the branchID to userGivenSubs collection
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) throw "Document does not exist!";
            const newUserLikes = userGivenSubsDoc.data()?.likes + 1;
            transaction.update(userGivenSubsRef, {likes: newUserLikes});

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            const newUserListLikes = [...userGivenSubsListDoc.data()?.likes, snapshot.data().userID];
            transaction.update(userGivenSubsRef, {likes: newUserListLikes});

            // TODO: check array duplicates
            // TODO: handle the new likes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the likes may go viral.
        });
    });

