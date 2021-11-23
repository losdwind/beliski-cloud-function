import * as functions from "firebase-functions";

export const onUpdateUser = functions.firestore
  .document("/users/{userID}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    if (newValue === previousValue) {
      return;
    }

    // only allow change of the profileimage and nickName
    return change.after.ref.update({
      profileImageURL: newValue.profileImageURL,
      nickName: newValue.nickName,
    });

    // TODO: need to handle the change in other firestore collections
  });
