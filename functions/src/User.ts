import * as functions from "firebase-functions";

export const onUpdateUser = functions.firestore
    .document("/users/{userID}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (newValue === previousValue) return;

        if (context.auth?.uid == previousValue.id) {
            // only allow change of the profile Image and nickName
            return change.after.ref.update({
                profileImageURL: newValue.profileImageURL,
                nickName: newValue.nickName,
            });
        } else return;

        // TODO: need to handle the change in other firestore collections
    });
