import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onWriteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/likes/{likeID")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // add file to the likes collection
            transaction.create(snapshot.ref, snapshot);
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

            // increase the userGivenSubs + 1
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
            const newUserListLikes = new Array(new Set([...userGivenSubsListDoc.data()?.likes, snapshot.data().userID]));
            transaction.update(userGivenSubsRef, {likes: newUserListLikes});

            // TODO: handle the new likes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the likes may go viral.
        });
    });
export const onDeleteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/likes/{likeID")
    .onDelete(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // delete file from the likes collection
            transaction.delete(snapshot.ref);
            // decrease the branch likes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newLikes = branchDoc.data()?.likes - 1;
            transaction.update(branchRef, {likes: newLikes});

            // decrease the userGivenSubs - 1
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
            const newUserListLikes = userGivenSubsListDoc.data()?.likes
                .filter((key: string) => key != snapshot.data().userID);
            // const index = userGivenSubsListDoc.data()?
            // .findIndex((item: any) => item == snapshot.data().userID);
            // if (index > -1) {
            //     userGivenSubsListDoc.data()?.splice(index, 1);
            // }
            transaction.update(userGivenSubsRef, {likes: newUserListLikes});

            // TODO: handle the new likes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the likes may go viral.
        });
    });


