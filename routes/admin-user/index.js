// This file is where all the individual routes for the admin user API endpoints are built. 
const express = require("express")
const tldjs = require("tldjs")

const api = require("./api.js")

const authAdminUser = require("../../middlewares/index.js").authAdminUser

const config = require("../../config.js")

// express.Router() creates a new router object
// It is an Express instance that will be used as middleware in the application
const app = express.Router()

/*
// Calling the createNewAdminUser function decalred inside the /routes/admin-user/api.js file with actual parameters
api.createNewAdminUser("PetarPandzharov@protonmail.ch", "1234567", function (apiResponse) {
    console.log(apiResponse);
})
*/

// A middleware function that have access to the request and response objects 
// It applies to the /users/login path
// The HTTP method to which the middleware applies is PUT
app.put("/users/login", function (req, res) {
    // When a request is received from the admin website, it should include both an email address and password in the request body.
    // If both items are not found, a failure response will be sent back to the admin website.
    if (!req.body.email || !req.body.password) {
        res.json({ success: false })
    } else {
        // If the email and password match what's in the database, a new auth token and expiration date
        // were set in the database. Those values should be stored in the browser's cookies so the admin user
        // can be authenticated without having to login again.
        api.loginAdminUser(req.body.email, req.body.password, function (apiResponse) {
            if (!apiResponse.success) {
                res.json({ success: false })
            } else {
                const cookieSettings = {
                    // the URL path for what page the cookie data belongs to. By setting this to "/", it will work for all
                    // pages on the website
                    path: "/",
                    // the expiration date of the cookie in GMT formatted time. This should match the authentication token
                    // expiration date stored in the database
                    expires: new Date(apiResponse.authTokenExpiresTimestamp * 1000),
                    // flags the cookie to only be accessible by the admin REST API application. This restricts JavaScript
                    // in the browser from accessing the cookie data, which will act as protection from potential
                    // cross-site scripting XSS attacks
                    httpOnly: true,
                    // marks the cookie to be used with HTTPS only. This should only be applied in production mode, otherwise
                    // testing things in development mode would be impossible (where HTTP is used)
                    secure: process.env.NODE_ENV === "production",
                    // the method used for cookie value encoding. In this case the cookie is a String data type. 
                    // This would normally default to encodeURLComponent
                    sameSite: "none",
                    encode: String,
                    // the domain name assigned to the cookie. This must exactly match the domain of the admin website,
                    // otherwise the cookie won't work. The tldjs NPM package is used to dynamically extract 
                    // the domain name from the production admin URL (stored in the config.js file)
                    domain: process.env.NODE_ENV === "production" ? tldjs.parse(config.prodAdminURL).domain : ""
                }
                // To do the above, the res.cookie() Express method was used to attach the cookie data to the response that 
                // is sent back to the admin website. The cookie have a name of adminUser and include a string value of 
                // your admin user's id and auth token combined and separated by the & symbol. 
                res.cookie("adminUser", apiResponse.userId + "&" + apiResponse.authToken, cookieSettings)

                res.json({ success: true })
            }
        })
    }
})

app.get("/users/authenticate", function (req, res) {
    const cookies = req.cookies.adminUser ? req.cookies.adminUser.split("&") : null

    let authUserId = cookies ? cookies[0] : ""
    let authToken = cookies ? cookies[1] : ""

    if (!authUserId || !authToken) {
        res.json({ success: false })
    } else {
        api.authenticateAdminUser(authUserId, authToken, function (apiResponse) {
            res.json(apiResponse)
        })
    }
})

app.put("/users/logout", authAdminUser, function (req, res) {
    if (!res.locals.authSuccess) {
        res.json({ authSuccess: false })
    } else {
        api.removeAdminUserAuthToken(res.locals.authUserId, function (apiResponse) {
            apiResponse.authSuccess = true
            res.json(apiResponse)
        })
    }
})

app.put("/users/remove-admin-user-cookie", function (req, res) {
    res.clearCookie("adminUser", {
        path: "/",
        domain: process.env.NODE_ENV === "production" ? tldjs.parse(config.prodAdminURL).domain : ""
    })

    res.json({ success: true })
})

app.put("/users/change-password", authAdminUser, function (req, res) {
    if (!req.body.currentPassword || !req.body.newPassword) {
        res.json({ success: false })
    } else if (!res.locals.authSuccess) {
        res.json({ authSuccess: false })
    } else {
        api.changeAdminUserPassword(res.locals.authUserId, req.body.currentPassword, req.body.newPassword, function (apiResponse) {
            apiResponse.authSuccess = true
            res.json(apiResponse)
        })
    }
})

module.exports = app
