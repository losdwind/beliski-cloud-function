import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Counter} from "./distributed_counter";

type Action = {
    id: string;
    senderID: string;
    objectID: string;
    receiverID: string;
    onField: "likes" | "dislikes" | "subs"
    dateCreated: admin.firestore.FieldValue;
};

export const onCallAction = functions.https.onCall(async (data, context) => {
    // context.app will be undefined if the request doesn't include a valid
    // App Check token.
    console.log(data);
    const action: Action = {
        id: data.id,
        senderID: data.senderID,
        objectID: data.objectID,
        receiverID: data.receiverID,
        onField: data.onField,
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
    };
    console.log(action);
    if (context.app == undefined || context.auth?.uid == undefined) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "The function must be called from an App Check verified app with valid user authentication.");
    }
    return admin.firestore().runTransaction(async (transaction) => {
        const field = action.onField;
        const branchID = action.objectID;
        const receiverID = action.receiverID;
        const senderID = action.senderID;
        const branchRef = admin.firestore()
            .collection("users")
            .doc(receiverID)
            .collection("branches")
            .doc(branchID);
        const actionRef = admin.firestore()
            .collection("users")
            .doc(receiverID)
            .collection("branches")
            .doc(branchID).collection(field).doc(senderID);
        const userGivenSubsRef = admin.firestore()
            .collection("users")
            .doc(senderID)
            .collection("privates")
            .doc("userGivenSubs");
        const userGivenSubsListRef = admin.firestore()
            .collection("users")
            .doc(senderID)
            .collection("privates")
            .doc("userGivenSubsList");
        const userReceivedSubsRef = admin.firestore()
            .collection("users")
            .doc(receiverID)
            .collection("privates")
            .doc("userReceivedSubs");
        // check if the likes/dislikes/subs has already exist in database
        // if exist, delete
        // if not exist, add
        const actionDoc = await transaction.get(actionRef);
        const userGivenSubsDoc = await transaction.get(userGivenSubsRef);
        const userGivenSubsListDoc = await transaction.get(userGivenSubsListRef);
        if (!actionDoc.exists) {
            const property = new Counter(branchRef, field);
            property.incrementBy(1);
            const receiverProperty = new Counter(userReceivedSubsRef, field);
            receiverProperty.incrementBy(1);
            const userGivenSubsDocObject = userGivenSubsDoc.data()!;
            const newValue = userGivenSubsDocObject[field] + 1;
            const userGivenSubsListDocObject = userGivenSubsListDoc.data()!;
            const newValueList = Array.from(new Set([...userGivenSubsListDocObject[field], branchID]));
            action.dateCreated = admin.firestore.FieldValue.serverTimestamp();
            transaction.create(actionRef, action);
            transaction.update(userGivenSubsRef, {[field]: newValue});
            transaction.update(userGivenSubsListRef, {[field]: newValueList});
            return {action: "added"};
        } else {
            const property = new Counter(branchRef, field);
            property.incrementBy(-1);
            const receiverProperty = new Counter(userReceivedSubsRef, field);
            receiverProperty.incrementBy(-1);
            const userGivenSubsDocObject = userGivenSubsDoc.data()!;
            const newValue = userGivenSubsDocObject[field] - 1;
            const userGivenSubsListDocObject = userGivenSubsListDoc.data()!;
            const newValueList = userGivenSubsListDocObject[field]
                .filter((key: string) => key != branchID);
            transaction.delete(actionRef);
            transaction.update(userGivenSubsRef, {[field]: newValue});
            transaction.update(userGivenSubsListRef, {[field]: newValueList});
            return {action: "cancelled"};
        }
    });
});

