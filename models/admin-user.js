// The admin user is a database item that represents me
const mongoose = require("mongoose");

// I don't want to store user's passwords as plain text in the database.
// Instead, I want to salt and hash the password before storing it.
// bcrypt incorporates hash encryption along with a work factor,
// which allows me to determine how expensive the hash function will be (i.e. how long it takes to decrypt it by brute force measures).
// Therefore, it keeps up with Moore's law, so as computers get faster I can increase the work factor and the hash will get slower to brute force.
const bcrypt = require("bcryptjs");

// Creating of a new Mongoose Schema
// The AdminUserSchema maps to the admin-users collection
// The name of the binding starts with a capital letter
// The collection option/key inside the object is used to give the collection a name 
const AdminUserSchema = new mongoose.Schema({
    // a unique identifier given to each admin user, in the form of a randomly generated string
    id: {
        type: String,
        unique: true
    },
    // the email address for the admin user
    email: {
        type: String,
        unique: true
    },
    // the password for the admin user
    password: String,
    // a random string stored in the database and the browser's cookies after
    // successfully logging in. This will be used to authenticate the admin user before reading
    // or writing to the databse
    authToken: String,
    // a UNIX representing when the authToken is no longer valid
    authTokenExpiresTimestamp: Number
}, { collection: "admin-users" });

// It hashes the password whenever an admin user document is saved to the database.
// It's done with a Mongoose pre middleware function that will be called before any admin user document being saved or changed. 
AdminUserSchema.pre("save", function (next) {
    const user = this;
    // Checking whether or not the function needs to hash a password
    // If the password is modified or a new document added to the database
    // the pre function will do hashing. 
    if (this.isModified("password") || this.isNew) {
        // Generates a salt for the password
        // It takes a salt rounds integer of 10 and returns a callback function
        // with the generated salt result
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            // Generates a hash for the password by taking the password and the salt as parameters
            // and returns the generated hash string for the password
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next()
            })
        })
    } else {
        return next();
    }
})

// The comparePassword() method uses bcrypt to compare the password parameter (from the website login form)
// and the hashed password stored in the database. If the passwords match, a success message is sent back. If not,
// a failure message is sent back.
AdminUserSchema.methods.comparePassword = function (pw, cb) {
    bcrypt.compare(pw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err)
        }
        cb(null, isMatch)
    })
}

// Convering the schema definition into a Mongoose Model one can work with
// This is done by passing the AdminUserSchema to the mongoose.model() method, 
// which is then exported
// Now, one can require() the model and use it in other files where interaction with the database is needed
module.exports = mongoose.model("AdminUser", AdminUserSchema);

