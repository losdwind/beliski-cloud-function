import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import FieldValue = admin.firestore.FieldValue;

export const onWriteDislike = functions.firestore
    .document("users/{userID}/branches/{branchID}/dislikes/{dislikeID")
    .onCreate(async (snapshot, context) => {
        // increase the branch dislikes + 1
        const newBranchDislikes = admin.firestore()
            .collection("users")
            .doc(snapshot.data().userID)
            .collection("branches")
            .doc(snapshot.data().branchID)
            .update({dislikes: FieldValue.increment(1)});


        // increase the userGivenDislikes + 1
        const newUserGivenDislikes = admin.firestore()
            .collection("users")
            .doc(snapshot.data().userID)
            .collection("privates")
            .doc("userGivenSubs")
            .update({dislikes: FieldValue.increment(1)});

        try {
            const oldDislikesListDoc = await admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList").get();
            const oldDislikesList = oldDislikesListDoc.data()?.dislikes;
            const newDislikeList = new Array(new Set([...oldDislikesList, snapshot.data().userID]));
            const newUserGivenDislikesList = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList")
                .update({dislikes: newDislikeList});
            return Promise.all([newBranchDislikes, newUserGivenDislikes, newUserGivenDislikesList]);
        } catch (e) {
            console.log(e);
            return;
        }
    });

export const onDeleteDislike = functions.firestore
    .document("users/{userID}/branches/{branchID}/dislikes/{dislikeID")
    .onDelete(async (snapshot, context) => {
        // increase the branch dislikes - 1
        const newBranchDislikes = admin.firestore()
            .collection("users")
            .doc(snapshot.data().userID)
            .collection("branches")
            .doc(snapshot.data().branchID)
            .update({dislikes: FieldValue.increment(-1)});


        // increase the userGivenDislikes - 1
        const newUserGivenDislikes = admin.firestore()
            .collection("users")
            .doc(snapshot.data().userID)
            .collection("privates")
            .doc("userGivenSubs")
            .update({dislikes: FieldValue.increment(-1)});

        try {
            const oldDislikesListDoc = await admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList").get();
            const oldDislikesList = oldDislikesListDoc.data()?.dislikes;
            // the line below will create new list which may remove implicit dependency
            const newDislikeList = oldDislikesList.data()?.dislikes
                .filter((key: string) => key != snapshot.data().userID);
            // const index = userGivenSubsListDoc.data()?
            // .findIndex((item: any) => item == snapshot.data().userID);
            // if (index > -1) {
            //     userGivenSubsListDoc.data()?.splice(index, 1);
            // }
            const newUserGivenDislikesList = admin.firestore()
                .collection("users")
                .doc(snapshot.data().userID)
                .collection("privates")
                .doc("userGivenSubsList")
                .update({dislikes: newDislikeList});
            return Promise.all([newBranchDislikes, newUserGivenDislikes, newUserGivenDislikesList]);
        } catch (e) {
            console.log(e);
            return;
        }
    });
