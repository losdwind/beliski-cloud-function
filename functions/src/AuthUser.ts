import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


type User {
    id: String;
    email: String;
    profileImageURL: String;
    nickName: String;//first name, family name
    dateCreated: admin.firestore.Timestamp;
}


export const onCreateUser = functions.auth.user().onCreate(async user => {

    const userInfo =  admin.firestore().collection("users").doc(user.uid).set(user)

    const privateInfo = admin.firestore().collection("users").doc(user.uid).collection("privates").doc("private").set({
        id: user.uid,
        email: user.email,
        profileImageURL: user.photoURL,
        nickName: user.displayName,
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
        
    })

    const subscribeInfo = admin.firestore().collection("users").doc(user.uid).collection("privates").doc("subscribe").set({
        id: user.uid,
        email: user.email,
        profileImageURL: user.photoURL,
        nickName: user.displayName,
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
    })

    return await Promise.all([userInfo,privateInfo,subscribeInfo])
})



export const onDeleteUser = functions.auth.user().onDelete(async user => {
    const userInfo = admin.firestore.collection("users").doc(user.uid).delete()

    const privateInfo = admin.firestore().collection("users").doc(user.uid).collection("privates").doc("private").delete()

    const subscribeInfo = admin.firestore().collection("users").doc(user.uid).collection("privates").doc("subscribe").delete()

    return await Promise.all([userInfo,privateInfo,subscribeInfo])
})

