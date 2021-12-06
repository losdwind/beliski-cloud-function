import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as users from "./user";
import * as branches from "./branch";
import * as communityLikes from "./community_likes";
import * as communityDislikes from "./community_dislikes";
import * as communitySubs from "./community_subs";
import * as linkedItems from "./linked_items";
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
    dislikes: number,
    comments: number,
    shares: number,
    subs: number,
}

type UserReceived = {
    id: string,
    likes: number,
    dislikes: number,
    comments: number,
    shares: number,
    subs: number,
}

type UserGivenList = {
    id: string,
    likes: string[],
    dislikes: string[],
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
        dislikes: 0,
        comments: 0,
        shares: 0,
        subs: 0,
    };

    const userReceivedSubs: UserReceived = {
        id: user.uid,
        likes: 0,
        dislikes: 0,
        comments: 0,
        shares: 0,
        subs: 0,
    };

    const userGivenSubsList: UserGivenList = {
        id: user.uid,
        likes: [],
        dislikes: [],
        comments: [],
        shares: [],
        subs: [],
    };
    const userInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .create(newUser);


    const privateInfo = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userPrivates")
        .create({
            id: user.uid,
        });

    const outgoingSubs = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userGivenSubs")
        .create(userGivenSubs);

    const outgoingSubsList = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userGivenSubsList")
        .create(userGivenSubsList);

    const ingoingSubs = admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .collection("privates")
        .doc("userReceivedSubs")
        .create(userReceivedSubs);

    // eslint-disable-next-line max-len
    return Promise.all([userInfo, privateInfo, outgoingSubs, outgoingSubsList, ingoingSubs]).catch((err) => console.log(err));
});

// // TODO: check the requirement of deleting a user
// export const onDeleteUser = functions.auth.user().onDelete(async (user) => {
//     const docRef = admin.firestore().collection("users").doc(user.uid);
//     return admin.firestore().recursiveDelete(docRef).catch((err) => console.log(err));
//     // TODO: handle the delete case when user have open branches and have other members.
// });
// TODO: add more export functions in separate files
export const userFunctions = users;
export const branchFunctions = branches;
export const communityLikesFunctions = communityLikes;
export const communityDislikesFunctions = communityDislikes;
export const communitySubsFunctions = communitySubs;
export const linkedItemsFunctions = linkedItems;
