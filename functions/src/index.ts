import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as users from "./User";
import * as branches from "./Branch";
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

admin.initializeApp();

type User = {
    id: string;
    email: string;
    profileImageURL: string;
    nickName: string; // first name, family name
    dateCreated: admin.firestore.FieldValue;
};

type UserGiven = {
    id: string,
    likes: number,
    disLikes: number,
    comments: number,
    shares: number,
    subs: number,
}

type UserReceived = {
    id: string,
    likes: number,
    disLikes: number,
    comments: number,
    shares: number,
    subs: number,
}

type UserGivenList = {
    id: string,
    likes: string[],
    disLikes: string[],
    comments: string[],
    shares: string[],
    subs: string[],
}


export const onCreateUser = functions.auth.user().onCreate(async (user) => {
    const newUser: User = {
        id: user.uid,
        email: user.email ?? "unknown",
        profileImageURL: user.photoURL ?? "https://avatars.dicebear.com/api/jdenticon/:seed.svg",
        nickName: user.displayName ?? "unknown",
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userGivenSubs: UserGiven = {
        id: user.uid,
        likes: 0,
        disLikes: 0,
        comments: 0,
        shares: 0,
        subs: 0,
    };

    const userReceivedSubs: UserReceived = {
        id: user.uid,
        likes: 0,
        disLikes: 0,
        comments: 0,
        shares: 0,
        subs: 0,
    };

    const userGivenSubsList: UserGivenList = {
        id: user.uid,
        likes: [],
        disLikes: [],
        comments: [],
        shares: [],
        subs: [],
    };

    const userInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .set(newUser);


    const privateInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userPrivates")
        .set({
            id: user.uid,
        });

    const outgoingSubs = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userGivenSubs")
        .set(userGivenSubs);

    const outgoingSubsList = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userGivenSubsList")
        .set(userGivenSubsList);

    const ingoingSubs = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userReceivedSubs")
        .set(userReceivedSubs);

    // eslint-disable-next-line max-len
    return Promise.all([userInfo, privateInfo, outgoingSubs, outgoingSubsList, ingoingSubs]);
});

// TODO: check the requirement of deleting a user
export const onDeleteUser = functions.auth.user().onDelete(async (user) => {
    const userInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .delete();

    const privateInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userPrivates")
        .delete();

    const subscribeInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userGivenSubs")
        .delete();

    const subscribeInfoList = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userGivenSubsList")
        .delete();

    // eslint-disable-next-line max-len
    return Promise.all([userInfo, privateInfo, subscribeInfo, subscribeInfoList]);
});
// TODO: add more export functions in separate files
export const userFunctions = users;
export const branchFunctions = branches;


