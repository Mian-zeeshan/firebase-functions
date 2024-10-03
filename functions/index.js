/*eslint-disable */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.database();
const fcm = admin.messaging();

function addUserEmotion(routine, data) {
    const endAt = new Date(routine.to_time);
    const endAtHours = endAt.getUTCHours();
    const endAtMinutes = endAt.getUTCMinutes();
    const endAtYear = endAt.getFullYear();
    const today = new Date();
    const milliseconds = today.getTime();
    const eTimeDate = new Date(endAtYear, 1, 1, endAtHours, endAtMinutes, 0);
    const eETimeDate = new Date(eTimeDate);
    eETimeDate.setMinutes(eTimeDate.getMinutes() + 10);
    const showMilliseconds = eETimeDate.getTime();
    const ref = db.ref("Organizations").child(data.orgKey).child("Authors").child(data.authorKey).child("UserEmotionsHistory");
    let keyRef = ref.child(data.uid).push();
    let pushKey = keyRef.key;
    ref.child(data.uid).child(pushKey).set(
        {
            "key": pushKey,
            "user_name": data.name,
            "added_time": new Date().getTime(),
            "createdAt": milliseconds,
            "email": data.email,
            "emotion_name": "routine",
            "allow_feed": false,
            "emotionRating": `${data.scaling}/${data.scaling}`,
            "max_scaling": data.scaling,
            "power_tool": routine.name,
            "powerkit": "Daily Routine",
            "id": " ",
            "remind_in": 1,
            "outcome": "good",
            "updatedAt": milliseconds,
        }
    )
}

function storeLocalNotification(title, body, uid) {
    const ref = db.ref("Notification");
    let keyRef = ref.child(uid).push();
    let pushKey = keyRef.key;

    ref.child(uid).child(pushKey).set(
        {
            "notification_id": pushKey,
            "message": body,
            "timestamp": new Date().getTime(),
            "title": title,
            "is_read": false
        }
    )
}

exports.widgets = functions.pubsub.schedule("every 1 minutes").onRun((context) => {
    const ref = db.ref("Users");
    ref.once("value", (datasnapshot) => {
        datasnapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            if (`${data.status}` === "1" && data.orgKey && data.authorKey && data.uid) {

                console.log(data.status, "Status");
                console.log(data.orgKey, "ORG KEY");
                console.log(data.authorKey, "AUTHOR KEY");
                console.log(data.uid, "UID");

                const refOrg = db.ref("Organizations").child(data.orgKey);

                refOrg.once("value", (orgSnapshots) => {
                    let org_data = orgSnapshots.val();
                    if (org_data) {
                        if (org_data.allow_notifications) {
                            refOrg.child("Authors").child(data.authorKey).child("PowerKit").child(data.uid).once("value", (powerSnapshots) => {
                                let charge_data = powerSnapshots.val();
                                if (charge_data) {
                                    const goodRoutine = charge_data.DailyRoutine;
                                    const medication = charge_data.Medication;


       //** routine push notification here  */

                                    if (goodRoutine) {
                                        Object.keys(goodRoutine).forEach((key) => {
                                            if (goodRoutine[key].allow_notifications && goodRoutine[key].key && goodRoutine[key].routines) {
                                                for (let r = 0; r < goodRoutine[key].routines.length; r++) {
                                                    let goodRoutineName = goodRoutine[key].routines[r].name;
                                                    let routineName = goodRoutine[key].name;
                                                    let content = 'Your timer for "' + goodRoutineName + '" has started. Enjoy your time!';
                                                    // let content = "You timer for " + goodRoutine[key].routines[r].name + " has started. Enjoy your time!";
                                                    if (goodRoutine[key].routines[r].from_time && goodRoutine[key].routines[r].from_date) {
                                                        const startAt = new Date(goodRoutine[key].routines[r].from_time);
                                                        const endAt = new Date(goodRoutine[key].routines[r].to_time);
                                                        const startAtDate = new Date(goodRoutine[key].routines[r].from_date);
                                                        let currentDate = new Date();

                                                        // Calculate the date 10 years from now
                                                        let endAtDate = new Date(currentDate);
                                                        endAtDate.setFullYear(currentDate.getFullYear() + 10);
                                                        if (goodRoutine[key].routines[r].to_date) {
                                                            endAtDate = new Date(goodRoutine[key].routines[r].to_date);
                                                        }

                                                        const timeNow = new Date();

                                                        const timeNowHours = timeNow.getUTCHours();
                                                        let timeYear = startAt.getFullYear();
                                                        const startAtHours = startAt.getUTCHours();
                                                        const endAtHours = endAt.getUTCHours();
                                                        const startAtMinutes = startAt.getUTCMinutes();
                                                        const endAtMinutes = endAt.getUTCMinutes();
                                                        const timeNowMinutes = timeNow.getUTCMinutes();
                                                        const cTimeDate = new Date(timeYear, 1, 1, timeNowHours, timeNowMinutes, 0);
                                                        const sTimeDate = new Date(timeYear, 1, 1, startAtHours, startAtMinutes, 0);
                                                        const sETimeDate = new Date(sTimeDate);
                                                        sETimeDate.setMinutes(sTimeDate.getMinutes());
                                                        const eTimeDate = new Date(timeYear, 1, 1, endAtHours, endAtMinutes, 0);
                                                        const eETimeDate = new Date(eTimeDate);
                                                        eETimeDate.setMinutes(eTimeDate.getMinutes());

                                                        if (timeNow >= startAtDate && timeNow <= endAtDate) {
                                                            if (cTimeDate >= sTimeDate && cTimeDate <= sETimeDate) {
                                                                if (goodRoutine[key].routines[r].timestamp) {
                                                                    const notiTime = new Date(goodRoutine[key].routines[r].timestamp);
                                                                    if (notiTime.getDate() !== timeNow.getDate()) {
                                                                        const uid = data.uid;
                                                                        const tokenRef = db.ref("Tokens").child(uid);
                                                                        tokenRef.once("value", (tokenSnapshot) => {
                                                                            const tokenData = tokenSnapshot.val();
                                                                            const token = tokenData.token;
                                                                            const messages = [];
                                                                            messages.push({
                                                                                notification: {
                                                                                    // title:"Task Start",
                                                                                    title: "eMoodBook",
                                                                                    body: content
                                                                                },
                                                                                token: token,
                                                                                data: {
                                                                                    notificationId: "dailyroutine",
                                                                                    val:routineName // Include a unique identifier in the data payload
                                                                                },
                                                                                apns: {
                                                                                    payload: {
                                                                                        aps: {
                                                                                            sound: "default",
                                                                                        },
                                                                                    },
                                                                                },
                                                                            });
                                                                            admin.messaging().send(messages[0])
                                                                                .then((response) => {
                                                                                    storeLocalNotification("Task Time Start", content, uid);

                                                                                    console.log(response.successCount + " messages were sent successfully");

                                                                                    // db.ref("Organizations").child(data.orgKey)
                                                                                    //     .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                    //     .child(data.uid).child("DailyRoutine").child(goodRoutine[key].key).child("routines")
                                                                                    //     .child(r).update({timestamp: new Date().getTime()});
                                                                                });
                                                                        });
                                                                    }
                                                                } else {
                                                                    const uid = data.uid;
                                                                    const tokenRef = db.ref("Tokens").child(uid);
                                                                    tokenRef.once("value", (tokenSnapshot) => {
                                                                        const tokenData = tokenSnapshot.val();
                                                                        const token = tokenData.token;
                                                                        const messages = [];
                                                                        messages.push({
                                                                            notification: {
                                                                                // title:"Task Start",
                                                                                title: "eMoodBook",
                                                                                body: content
                                                                            },
                                                                            token: token,
                                                                            data: {
                                                                                notificationId: "dailyroutine",
                                                                                val:routineName // Include a unique identifier in the data payload
                                                                            },
                                                                            apns: {
                                                                                payload: {
                                                                                    aps: {
                                                                                        sound: "default",
                                                                                    },
                                                                                },
                                                                            },
                                                                        });
                                                                        admin.messaging().send(messages[0])
                                                                            .then((response) => {
                                                                                storeLocalNotification("Task Time Start", content, uid);
                                                                                console.log(response.successCount + " messages were sent successfully");

                                                                                // db.ref("Organizations").child(data.orgKey)
                                                                                // .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                // .child(data.uid).child("DailyRoutine").child(goodRoutine[key].key).child("routines")
                                                                                // .child(r).update({timestamp: new Date().getTime()});
                                                                            });
                                                                    });
                                                                }
                                                            }
                                                            else if (
                                                                cTimeDate >= eTimeDate && cTimeDate <= eETimeDate && endAt && endAt !== undefined

                                                                // cTimeDate === eTimeDate

                                                            ) {
                                                                // content = "Your timer for " + goodRoutine[key].routines[r].name +
                                                                //     " has ended. We hope you had a great time.";
                                                                content = 'Your timer for "' + goodRoutineName + '" has ended. We hope you had a great time!';
                                                                if (goodRoutine[key].routines[r].etimestamp) {
                                                                    const notiTime = new Date(goodRoutine[key].routines[r].etimestamp);
                                                                    if (notiTime.getDate() !== timeNow.getDate()) {
                                                                        const uid = data.uid;
                                                                        const tokenRef = db.ref("Tokens").child(uid);
                                                                        tokenRef.once("value", (tokenSnapshot) => {
                                                                            const tokenData = tokenSnapshot.val();
                                                                            const token = tokenData.token;
                                                                            const messages = [];
                                                                            messages.push({
                                                                                notification: {
                                                                                    title: "eMoodBook",
                                                                                    body: content
                                                                                },
                                                                                token: token,
                                                                                data: {
                                                                                    notificationId: "dailyroutine",
                                                                                    val:routineName // Include a unique identifier in the data payload
                                                                                },
                                                                                apns: {
                                                                                    payload: {
                                                                                        aps: {
                                                                                            sound: "default",
                                                                                        },
                                                                                    },
                                                                                },
                                                                            });
                                                                            // addUserEmotion(goodRoutine[key].routines[r], data);
                                                                            admin.messaging().send(messages[0])
                                                                                .then((response) => {
                                                                                    storeLocalNotification("Task Time End", content, uid);
                                                                                    console.log(response.successCount + " messages were sent successfully");
                                                                                    // db.ref("Organizations").child(data.orgKey)
                                                                                    // .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                    // .child(data.uid).child("DailyRoutine").child(goodRoutine[key].key).child("routines")
                                                                                    // .child(r).update({etimestamp: new Date().getTime()});
                                                                                });
                                                                        })
                                                                    }
                                                                } else {
                                                                    const uid = data.uid;
                                                                    const tokenRef = db.ref("Tokens").child(uid);
                                                                    tokenRef.once("value", (tokenSnapshot) => {
                                                                        const tokenData = tokenSnapshot.val();
                                                                        const token = tokenData.token;
                                                                        const messages = [];
                                                                        messages.push({
                                                                            notification: {
                                                                                title: "eMoodBook",
                                                                                body: content
                                                                            },
                                                                            token: token,
                                                                            data: {
                                                                                notificationId: "dailyroutine",
                                                                                val:routineName // Include a unique identifier in the data payload
                                                                            },
                                                                            apns: {
                                                                                payload: {
                                                                                    aps: {
                                                                                        sound: "default",
                                                                                    },
                                                                                },
                                                                            },
                                                                        });
                                                                        // addUserEmotion(goodRoutine[key].routines[r], data);
                                                                        admin.messaging().send(messages[0])
                                                                            .then((response) => {
                                                                                storeLocalNotification("Task Time End", content, uid);
                                                                                console.log(response.successCount + "routine  messages were sent successfully :::::::::::::::::::::::::::::::::::::::::::::::::::");
                                                                                // db.ref("Organizations").child(data.orgKey)
                                                                                // .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                // .child(data.uid).child("DailyRoutine").child(goodRoutine[key].key).child("routines")
                                                                                // .child(r).update({etimestamp: new Date().getTime()});
                                                                            });
                                                                    })
                                                                }

                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        })
                                    }
 //** medication push notification here */
                                    if (medication) {
                                        Object.keys(medication).forEach((key) => {
                                            if (medication[key].allow_notifications && medication[key].key && medication[key].routines) {
                                                for (let r = 0; r < medication[key].routines.length; r++) {
                                                    let medicationName = medication[key].routines[r].name;
                                                    let medName = medication[key].name;
                                                    let content = 'It\'s time to take your medication: "' + medicationName + '". Please take it now.';
                                                    // let content = "It's time to take your medication: "+ '${medication[key].routines[r].name}' +" Please take it now.";
                                                    if (medication[key].routines[r].from_time && medication[key].routines[r].from_date) {
                                                        const startAt = new Date(medication[key].routines[r].from_time);
                                                        const endAt = new Date(medication[key].routines[r].to_time);
                                                        const startAtDate = new Date(medication[key].routines[r].from_date);
                                                        let currentDate = new Date();

                                                        // Calculate the date 10 years from now
                                                        let endAtDate = new Date(currentDate);
                                                        endAtDate.setFullYear(currentDate.getFullYear() + 10);
                                                        if (medication[key].routines[r].to_date) {
                                                            endAtDate = new Date(medication[key].routines[r].to_date);
                                                        }
                                                        // const endAtDate = new Date(medication[key].routines[r].to_date);
                                                        const timeNow = new Date();

                                                        const timeNowHours = timeNow.getUTCHours();
                                                        let timeYear = startAt.getFullYear();
                                                        const startAtHours = startAt.getUTCHours();
                                                        const endAtHours = endAt.getUTCHours();
                                                        const startAtMinutes = startAt.getUTCMinutes();
                                                        const endAtMinutes = endAt.getUTCMinutes();
                                                        const timeNowMinutes = timeNow.getUTCMinutes();
                                                        const cTimeDate = new Date(timeYear, 1, 1, timeNowHours, timeNowMinutes, 0);
                                                        const sTimeDate = new Date(timeYear, 1, 1, startAtHours, startAtMinutes, 0);
                                                        const sETimeDate = new Date(sTimeDate);
                                                        sETimeDate.setMinutes(sTimeDate.getMinutes());
                                                        const eTimeDate = new Date(timeYear, 1, 1, endAtHours, endAtMinutes, 0);
                                                        const eETimeDate = new Date(eTimeDate);
                                                        eETimeDate.setMinutes(eTimeDate.getMinutes());

                                                        if (timeNow >= startAtDate && timeNow <= endAtDate) {
                                                            if (cTimeDate >= sTimeDate && cTimeDate <= sETimeDate) {
                                                                if (medication[key].routines[r].timestamp) {
                                                                    const notiTime = new Date(medication[key].routines[r].timestamp);
                                                                    if (notiTime.getDate() !== timeNow.getDate()) {
                                                                        const uid = data.uid;
                                                                        const tokenRef = db.ref("Tokens").child(uid);
                                                                        tokenRef.once("value", (tokenSnapshot) => {
                                                                            const tokenData = tokenSnapshot.val();
                                                                            const token = tokenData.token;
                                                                            const messages = [];
                                                                            messages.push({
                                                                                notification: {
                                                                                    title: "eMoodBook",
                                                                                    body: content
                                                                                },
                                                                                token: token,
                                                                                data: {
                                                                                    notificationId: "medication",
                                                                                    val:medName // Include a unique identifier in the data payload
                                                                                },
                                                                                apns: {
                                                                                    payload: {
                                                                                        aps: {
                                                                                            sound: "default",
                                                                                        },
                                                                                    },
                                                                                },
                                                                            });
                                                                            admin.messaging().send(messages[0])
                                                                                .then((response) => {
                                                                                    storeLocalNotification("Medication Time Start", content, uid);
                                                                                    console.log(response.successCount + " messages were sent successfully for medication ::::::::::::::::::::::::::::::::::");
                                                                                    // db.ref("Organizations").child(data.orgKey)
                                                                                    //     .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                    //     .child(data.uid).child("DailyRoutine").child(medication[key].key).child("routines")
                                                                                    //     .child(r).update({timestamp: new Date().getTime()});
                                                                                });
                                                                        });
                                                                    }
                                                                } else {
                                                                    const uid = data.uid;
                                                                    const tokenRef = db.ref("Tokens").child(uid);
                                                                    tokenRef.once("value", (tokenSnapshot) => {
                                                                        const tokenData = tokenSnapshot.val();
                                                                        const token = tokenData.token;
                                                                        const messages = [];
                                                                        messages.push({
                                                                            notification: {
                                                                                title: "eMoodBook",
                                                                                body: content
                                                                            },
                                                                            token: token,
                                                                            data: {
                                                                                notificationId: "medication",
                                                                                val:medName // Include a unique identifier in the data payload
                                                                            },
                                                                            apns: {
                                                                                payload: {
                                                                                    aps: {
                                                                                        sound: "default",
                                                                                    },
                                                                                },
                                                                            },
                                                                        });
                                                                        admin.messaging().send(messages[0])
                                                                            .then((response) => {
                                                                                storeLocalNotification("Medication Time Start", content, uid);
                                                                                console.log(response.successCount + " messages were sent successfully");
                                                                                // db.ref("Organizations").child(data.orgKey)
                                                                                //     .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                //     .child(data.uid).child("DailyRoutine").child(medication[key].key).child("routines")
                                                                                //     .child(r).update({timestamp: new Date().getTime()});
                                                                            });
                                                                    });
                                                                }
                                                            }
                                                            else if (cTimeDate >= eTimeDate && cTimeDate <= eETimeDate && endAt && endAt !== undefined) {
                                                                content = 'Your medication window for "' + medicationName + '" has ended. If you haven\'t taken it yet, please do so as soon as possible.';

                                                                // content = "Your medication window for " + medication[key].routines[r].name +
                                                                //     " has ended. If you haven't taken it yet, please do so as soon as possible.";
                                                                if (medication[key].routines[r].etimestamp) {
                                                                    const notiTime = new Date(medication[key].routines[r].etimestamp);
                                                                    if (notiTime.getDate() !== timeNow.getDate()) {
                                                                        const uid = data.uid;
                                                                        const tokenRef = db.ref("Tokens").child(uid);
                                                                        tokenRef.once("value", (tokenSnapshot) => {
                                                                            const tokenData = tokenSnapshot.val();
                                                                            const token = tokenData.token;
                                                                            const messages = [];
                                                                            messages.push({
                                                                                notification: {
                                                                                    title: "eMoodBook",
                                                                                    body: content
                                                                                },
                                                                                token: token,
                                                                                data: {
                                                                                    notificationId: "medication",
                                                                                    val:medName // Include a unique identifier in the data payload
                                                                                },
                                                                                apns: {
                                                                                    payload: {
                                                                                        aps: {
                                                                                            sound: "default",
                                                                                        },
                                                                                    },
                                                                                },
                                                                            });
                                                                            // addUserEmotion(medication[key].routines[r], data);
                                                                            admin.messaging().send(messages[0])
                                                                                .then((response) => {
                                                                                    storeLocalNotification("Medication Time End", content, uid);
                                                                                    console.log(response.successCount + " messages were sent successfully");
                                                                                    // db.ref("Organizations").child(data.orgKey)
                                                                                    //     .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                    //     .child(data.uid).child("DailyRoutine").child(medication[key].key).child("routines")
                                                                                    //     .child(r).update({etimestamp: new Date().getTime()});
                                                                                });
                                                                        })
                                                                    }
                                                                } else {
                                                                    const uid = data.uid;
                                                                    const tokenRef = db.ref("Tokens").child(uid);
                                                                    tokenRef.once("value", (tokenSnapshot) => {
                                                                        const tokenData = tokenSnapshot.val();
                                                                        const token = tokenData.token;
                                                                        const messages = [];
                                                                        messages.push({
                                                                            notification: {
                                                                                title: "eMoodBook",
                                                                                body: content
                                                                            },
                                                                            token: token,
                                                                            data: {
                                                                                notificationId: "medication",
                                                                                val:medName // Include a unique identifier in the data payload
                                                                            },
                                                                            apns: {
                                                                                payload: {
                                                                                    aps: {
                                                                                        sound: "default",
                                                                                    },
                                                                                },
                                                                            },
                                                                        });
                                                                        // addUserEmotion(medication[key].routines[r], data);
                                                                        admin.messaging().send(messages[0])
                                                                            .then((response) => {
                                                                                storeLocalNotification("Medication Time End", content, uid);
                                                                                console.log(response.successCount + " messages were sent successfully");
                                                                                // db.ref("Organizations").child(data.orgKey)
                                                                                //     .child("Authors").child(data.authorKey).child("PowerKit")
                                                                                //     .child(data.uid).child("DailyRoutine").child(medication[key].key).child("routines")
                                                                                //     .child(r).update({etimestamp: new Date().getTime()});
                                                                            });
                                                                    })
                                                                }

                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        })
                                    }
                                }
                            });

                            //Emotions Notifications
                            db.ref("Organizations").child(data.orgKey).child("Authors").child(data.authorKey)
                                .child("UserEmotionsHistory").child(data.uid).once('value', (historySnapshot) => {
                                    let history_data = historySnapshot.val();
                                    if (history_data) {
                                        Object.keys(history_data).forEach((key) => {

                                            if (history_data[key].outcome === null || history_data[key].outcome === undefined) {
                                                const startAt = new Date(history_data[key].added_time);
                                                const endAt = new Date(history_data[key].added_time);
                                                startAt.setMinutes(startAt.getMinutes() + history_data[key].remind_in);
                                                // endAt.setMinutes(endAt.getMinutes() + history_data[key].remind_in + 3);
                                                endAt.setMinutes(endAt.getMinutes() + history_data[key].remind_in + 1);
                                                const now = new Date();

                                                if (now.getTime() >= startAt.getTime() && now.getTime() <= endAt.getTime()) {
                                                    const uid = data.uid;
                                                    const tokenRef = db.ref("Tokens").child(uid);
                                                    tokenRef.once("value", (tokenSnapshot) => {
                                                        const tokenData = tokenSnapshot.val();
                                                        const token = tokenData.token;
                                                    
                                                        let content = `Have you completed "'${history_data[key].power_tool}'" while you were "'${history_data[key].emotion_name}'"?. Please give us feedback!`
                                                        const messages = [  {
                                                            notification: {
                                                                title: "eMoodBook",
                                                                body: content
                                                            },
                                                            token: token,
                                                            data: {
                                                                notificationId: "emotion", // Include a unique identifier in the data payload
                                                            },
                                                            apns: {
                                                                payload: {
                                                                    aps: {
                                                                        sound: "default",
                                                                    },
                                                                },
                                                            },
                                                        }];
                                                    //     messages.push(
                                                    //         {
                                                    //         notification: {
                                                    //             title: "eMoodBook",
                                                    //             body: content
                                                    //         },
                                                    //         token: token,
                                                    //         data: {
                                                    //             notificationId: "emotion", // Include a unique identifier in the data payload
                                                    //         },
                                                    //         apns: {
                                                    //             payload: {
                                                    //                 aps: {
                                                    //                     sound: "default",
                                                    //                 },
                                                    //             },
                                                    //         },
                                                    //     }
                                                    // );
                                                        // sendNotifications(messages);
                                                        admin.messaging().send(messages[0]).then((response) => {
                                                            console.log(`Emotion notification response ++++++++++++++++++++++++++++++++++++++++++: ${JSON.stringify(response)}`);
                                                            storeLocalNotification("Emotion Feedback", content, uid);
                                                        }).catch((error) => {
                                                            console.error('Error sending emotion notification:+++++++++++++++++++++++++++++++++++', error);
                                                        });
                                                    });
                                                }

                                            }

                                        }
                                        )
                                    }
                                })

                        }
                    }
                })
            }
        });
    });

});

// async function sendNotifications(messages) {
//     try {
//       // Send each message individually and wait for all promises to resolve
//       const responses = await Promise.all(
//         messages.map((message) => admin.messaging().send(message))
//       );
  
//       // Log responses or handle them as needed
//       console.log('Successfully sent messages of emotion ===============================================:', responses);
  
//       // Store local notification after sending
//       storeLocalNotification("Emotion Feedback", content, uid);
//     } catch (error) {
//       console.error('Error sending messages of emotion       :::::::::::::::::::::::::::::::::::::::', error);
//     }
//   }

function capitalizeFirstLetter(string) {
    if (typeof string !== 'string' || string.length === 0) {
        return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}


exports.sendNotificationOnMessageCreate = functions.database.ref('/Messages/{userId}/{messageId}')
    .onCreate(async (snapshot, context) => {

        const userId = context.params.userId;
        const messageId = context.params.messageId;


        console.log(`New message added by userId: ${userId}, messageId: ${messageId}`);

        // The newly added message data
        const messageData = snapshot.val();
        const fromUserID = messageData.fromUserID;
        const toUserID = messageData.toUserID;
        const message = messageData.message;

        // Log the message details for debugging
        console.log(`Message from: ${fromUserID} to: ${toUserID} - ${message}`);

        const [toUserSnapshot, doctorSnapshot, userDetail] = await Promise.all([db.ref(`/Tokens/${toUserID}`).once('value'),
        db.ref(`/Users/${fromUserID}`).once('value'),
        db.ref(`/Users/${toUserID}`).once('value')

        ]);
        const doctorval = doctorSnapshot.val();
        const doctorName = capitalizeFirstLetter(doctorval.name);

        const userDetailInfo = userDetail.val();
        const toUserToken = toUserSnapshot.val();

        const messages = [];
        if (userDetailInfo.isOnline==false || userDetailInfo.isOnline===undefined || userDetailInfo.isOnline==undefined || userDetailInfo.isOnline==null) {
            if (toUserToken) {
                messages.push({
                    notification: {
                        title: doctorName,
                        body: message,
                    },
                    token: toUserToken.token,
                    data: {
                        notificationId: "messages", // Include a unique identifier in the data payload
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                            },
                        },
                    },
                });
            }

            // Send notification to the receiver
            if (messages.length > 0) {
                try {
                    await admin.messaging().send(messages[0]);
                    console.log('Notification sent to receiver successfully');
                } catch (error) {
                    console.error('Error sending notification to receiver:', error);
                }
            }



        }



    });