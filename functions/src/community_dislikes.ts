import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onWriteDislike = functions.firestore
    .document("users/{userID}/branches/{branchID}/dislikes/{likeID")
    .onCreate(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // increase the branch dislikes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newDislikes = branchDoc.data()?.dislikes + 1;
            transaction.update(branchRef, {dislikes: newDislikes});

            // increase the userGivenSubs + 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) throw "Document does not exist!";
            const newUserDislikes = userGivenSubsDoc.data()?.dislikes + 1;
            transaction.update(userGivenSubsRef, {dislikes: newUserDislikes});

            // add the branchID to userGivenSubs collection
            const userGivenSubsListRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList");
            const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsListDoc.exists) throw "Document does not exist!";
            const newUserListDislikes = new Array(new Set([...userGivenSubsListDoc.data()?.dislikes, snapshot.data().userID]));
            transaction.update(userGivenSubsRef, {dislikes: newUserListDislikes});

            // TODO: handle the new dislikes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the dislikes may go viral.
        });
    });
export const onDeleteLike = functions.firestore
    .document("users/{userID}/branches/{branchID}/dislikes/{likeID")
    .onDelete(async (snapshot, context) => {
        return admin.firestore().runTransaction(async (transaction) => {
            // decrease the branch dislikes + 1
            const branchRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("branches")
                .doc(snapshot.data().branchID);
            const branchDoc = await transaction.get(branchRef);
            // eslint-disable-next-line no-throw-literal
            if (!branchDoc.exists) throw "Document does not exist!";
            const newDislikes = branchDoc.data()?.dislikes - 1;
            transaction.update(branchRef, {dislikes: newDislikes});

            // decrease the userGivenSubs - 1
            const userGivenSubsRef = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubs");
            const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
            // eslint-disable-next-line no-throw-literal
            if (!userGivenSubsDoc.exists) throw "Document does not exist!";
            const newUserDislikes = userGivenSubsDoc.data()?.dislikes + 1;
            transaction.update(userGivenSubsRef, {dislikes: newUserDislikes});

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
            const newUserListDislikes = userGivenSubsListDoc.data()?.dislikes
                .filter((key: string) => key != snapshot.data().userID);
            // const index = userGivenSubsListDoc.data()?
            // .findIndex((item: any) => item == snapshot.data().userID);
            // if (index > -1) {
            //     userGivenSubsListDoc.data()?.splice(index, 1);
            // }
            transaction.update(userGivenSubsRef, {dislikes: newUserListDislikes});

            // TODO: handle the new dislikes affect the user received Subs to all branch members,
            // possibly using an aggregation function because the dislikes may go viral.
        });
    });


