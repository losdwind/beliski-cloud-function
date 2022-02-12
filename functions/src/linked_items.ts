import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onCallLinkedItems = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include a valid
    // App Check token.
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "The function must be called from an App Check verified app.");
    }
    if (context.auth?.uid == undefined) {
        return [];
    }
    const linkedItemIDs = data;
    const linkedItems: { moment?: FirebaseFirestore.DocumentData; todo?: FirebaseFirestore.DocumentData; person?: FirebaseFirestore.DocumentData; branch?: FirebaseFirestore.DocumentData; }[] = [];
    linkedItemIDs.forEach(async (itemID: string) => {
        try {
            const moment = await admin.firestore().collection("users").doc(<string>context.auth?.uid).collection("moments").doc(itemID).get();
            if (moment.exists) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                linkedItems.push({"moment": moment.data()!});
            }
            const todo = await admin.firestore().collection("users").doc(<string>context.auth?.uid).collection("todos").doc(itemID).get();
            if (todo.exists) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                linkedItems.push({"todo": todo.data()!});
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const person = await admin.firestore().collection("users").doc(<string>context.auth?.uid).collection("persons").doc(itemID).get();
            if (person.exists) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                linkedItems.push({"person": person.data()!});
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const branch = await admin.firestore().collection("users").doc(<string>context.auth?.uid).collection("branches").doc(itemID).get();
            if (branch.exists) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                linkedItems.push({"branch": branch.data()!});
            }
        } catch (e) {
            console.log(e);
        }
    });

    return linkedItems;
});
