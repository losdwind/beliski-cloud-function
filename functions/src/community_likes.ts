import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Counter} from "./distributed_counter";

export const onWriteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/likes/{likeID}")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch likes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const likes = new Counter(branchRef, "likes");
            likes.incrementBy(1);
            // increase the userGivenSubs + 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) console.log("Document does not exist!");
            const newUserLikes = userGivenSubsDoc.data()?.likes + 1;

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
            console.log(userGivenSubsListDoc.data()?.likes);
            const newUserListLikes = Array.from(new Set([...userGivenSubsListDoc.data()?.likes, snapshot.data().branchID]));
            transaction.update(userGivenSubsRef, {likes: newUserLikes});
            transaction.update(userGivenSubsListRef, {likes: newUserListLikes});

            // TODO: handle the new likes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the likes may go viral.
            return;
        });
    });
export const onDeleteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/likes/{likeID}")
    .onDelete(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // decrease the branch likes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            // increase the branch likes + 1
            const likes = new Counter(branchRef, "likes");
            likes.incrementBy(-1);

            // decrease the userGivenSubs - 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) console.log("Document does not exist!");
            const newUserLikes = userGivenSubsDoc.data()?.likes - 1;

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
            const newUserListLikes = userGivenSubsListDoc.data()?.likes
                .filter((key: string) => key != snapshot.data().branchID);
            transaction.update(userGivenSubsRef, {likes: newUserLikes});
            transaction.update(userGivenSubsListRef, {likes: newUserListLikes});

            // TODO: handle the new likes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the likes may go viral.
            return;
        });
    });


