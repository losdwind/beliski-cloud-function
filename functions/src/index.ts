import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as user from "./User";
import * as branch from "./Branch";
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

admin.initializeApp();
// type User = {
//   id: String;
//   email: String;
//   profileImageURL: String;
//   nickName: String; //first name, family name
//   dateCreated: admin.firestore.Timestamp;
// };

export const onCreateUser = functions.auth.user().onCreate(async (user) => {
  const userInfo = admin.firestore().collection("users").doc(user.uid).set({
    id: user.uid,
    email: user.email,
    profileImageURL: user.photoURL,
    nickName: user.displayName,
    dateCreated: admin.firestore.FieldValue.serverTimestamp(),
  });

  const privateInfo = admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .collection("privates")
    .doc("userPrivate")
    .set({
      id: user.uid,
      realName: "",
      gender: "",
      birthday: "",
      address: "",
      mobile: "",
      job: "",
      income: "",
      marriage: "",
      misc: "",
    });

  const subscribeInfo = admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .collection("privates")
    .doc("userSubscription")
    .set({
      id: user.uid,
      likes: [],
      disLikes: [],
      comments: [],
      shares: [],
      subs: [],
    });

  return Promise.all([userInfo, privateInfo, subscribeInfo]);
});

export const onDeleteUser = functions.auth.user().onDelete(async (user) => {
  const userInfo = admin.firestore().collection("users").doc(user.uid).delete();

  const privateInfo = admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .collection("privates")
    .doc("userPrivate")
    .delete();

  const subscribeInfo = admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .collection("privates")
    .doc("userSubscription")
    .delete();

  return Promise.all([userInfo, privateInfo, subscribeInfo]);
});
// TODO: add more export functions in separate files
export const userFunctions = user;
export const branchFunctions = branch;


