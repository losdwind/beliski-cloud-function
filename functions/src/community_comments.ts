import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onWriteComment = functions.firestore
    .document("users/{userID}/branches/{branchID}/comments/{commentID")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // add file to the comments collection
            transaction.create(snapshot.ref, snapshot);
            // increase the branch comments + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newComments = branchDoc.data()?.comments + 1;
            transaction.update(branchRef, {comments: newComments});

            // increase the userGivenSubs + 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) throw "Document does not exist!";
            const newUserComments = userGivenSubsDoc.data()?.comments + 1;
            transaction.update(userGivenSubsRef, {comments: newUserComments});

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            const newUserListComments = new Array(new Set([...userGivenSubsListDoc.data()?.comments, snapshot.data().userID]));
            transaction.update(userGivenSubsRef, {comments: newUserListComments});

            // TODO: handle the new comments affect the user received Subs to all branch members,
            // possibly using an aggregation function because the comments may go viral.
        });
    });
