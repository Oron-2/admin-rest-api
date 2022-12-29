// This file consists of functions that interact directly with the MongoDB database
// and are imported into the index.js file to be used when needed.

// Library for generating random strings
const randomstring = require("randomstring");
// A JavaScript date library for parsing, validating, manipulating, and formatting dates
const moment = require("moment");

const AdminUserModel = require("../../models/admin-user.js");

// A module.exports object that will contain functions that can be 
// imported and used in the /routes/admin-user/index.js file. 
// Each function will have a callback function as one of its parameters.
// This will ensure that the route code waits until the database query
// is finished before sending the data back to the browser. 
module.exports = {
    // the function takes three parameters passed from the endpoint code that will be sent back to the API endpoint code when the function is complete
    loginAdminUser: function (email, password, callback) {
        // the findOne() Mongoose method is used on the AdminUserModel with the email property passed into it
        // then inside the exec() Mongoose method responsible for executing the query, a function is passed as parameter
        // that will retrieve the admin user from the database
        // If an error occurs  or the admin user is not found, an error message is sent back using the callback parameter
        AdminUserModel.findOne({ email: email }).exec(function (error, user) {
            if (error || !user) {
                callback({ success: false })
            } else {
                // The comparePassword() Mongoose method is used to compare the password parameter to what's stored in the database
                // If the password matches, an authToken and authTokenExpirationTimestamp are created and saved to the database.
                // Those values also need to be included in the callback function that gets sent back
                user.comparePassword(password, function (matchError, isMatch) {
                    if (matchError || !isMatch) {
                        callback({ success: false })
                    } else {
                        const authTokenString = randomstring.generate(40)
                        const authTokenExpiresTimestamp = moment().unix() + (86400 * 3)

                        user.authToken = authTokenString
                        user.authTokenExpiresTimestamp = authTokenExpiresTimestamp

                        user.save(function (saveError) {
                            if (saveError) {
                                callback({ success: false })
                            } else {
                                callback({ success: true, userId: user.id, authToken: authTokenString, authTokenExpiresTimestamp: authTokenExpiresTimestamp })
                            }
                        })
                    }
                })
            }
        })
    },

    authenticateAdminUser: function (userId, authToken, callback) {
        AdminUserModel.findOne({ id: userId }).exec(function (error, user) {
            if (error || !user || authToken !== user.authToken || moment().unix() > user.authTokenExpiresTimestamp) {
                callback({ success: false })
            } else {
                callback({ success: true })
            }
        })
    },

    removeAdminUserAuthToken: function (userId, callback) {
        AdminUserModel.findOne({ id: userId }).exec(function (error, user) {
            if (error || !user) {
                callback({ success: false })
            } else {
                user.authToken = null
                user.authTokenExpiresTimestamp = null

                user.save(function (saveError) {
                    if (saveError) {
                        callback({ success: false })
                    } else {
                        callback({ success: true })
                    }
                })
            }
        })
    },

    changeAdminUserPassword: function (userId, currentPassword, newPassword, callback) {
        AdminUserModel.findOne({ id: userId }).exec(function (error, user) {
            if (error || !user) {
                callback({ submitError: true })
            } else {
                user.comparePassword(currentPassword, function (matchError, isMatch) {
                    if (matchError) {
                        callback({ submitError: true })
                    } else if (!isMatch) {
                        callback({ invalidPasswordCredentialError: true })
                    } else {
                        user.password = newPassword

                        user.save(function (saveError) {
                            if (saveError) {
                                callback({ submitError: true })
                            } else {
                                callback({ success: true })
                            }
                        })
                    }
                })
            }
        })
    }

    /*
    // The createNewAdminUser function will run one time to create a new admin user in the database.
    // It has a key-value structure. The name of the function is the key and the value is the function itself
    createNewAdminUser: function (email, password, callback) {
        // A new instance of the AdminUserModel is created and the 
        // Note! An instance of a model is called a document.
        const newAdminUser = new AdminUserModel({
            // randomly generated string using the randomstring NPM package
            // with a length of 20 characters
            id: randomstring.generate(20),
            email: email,
            password: password,
            authToken: randomstring.generate(40),
            // A UNIX timestamp three days in the future. 
            // moment().unix() returns the current UNIX timestamp
            // and 86400 * 3 represents three days converted to seconds
            authTokenExpiresTimestamp: moment().unix() + (8600 * 3)
        });

        newAdminUser.save(function (newDocError, newDoc) {
            if (newDocError) {
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        });
    }
    */
}
