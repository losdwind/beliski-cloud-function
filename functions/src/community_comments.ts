import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Counter} from "./distributed_counter";

export const onWriteComment = functions.firestore
    .document("users/{userID}/branches/{branchID}/comments/{commentID}")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch comments + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const comments = new Counter(branchRef, "comments");
            comments.incrementBy(1);

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

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            const newUserListComments = Array.from(new Set([...userGivenSubsListDoc.data()?.comments, snapshot.data().branchID]));
            transaction.update(userGivenSubsRef, {comments: newUserComments});
            transaction.update(userGivenSubsListRef, {comments: newUserListComments});

            // TODO: handle the new comments affect the user received Subs to all branch members,
            // possibly using an aggregation function because the comments may go viral.
        });
    });
