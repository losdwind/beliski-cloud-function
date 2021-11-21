import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


export const onUpdateUser = functions.firestore.document("/{users}/{userID}").onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    if newValue == previousValue {
        return 
    }
    
})