// This file servers as the entry point to the application.

// require() is the easiest way to include modules that exist in separate files
// The basic functionality of require is that it reads a JavaScript file, 
// executes the file, and then proceeds to return the exports object
// require(express) imports the Express.js framework
// I save that into an express binding
const express = require("express");
// express() executes the express binding
// the result is saved into the app binding
// the returned value of express(), which in this case is represented
// by the app binding is a JS function that can be passed to callback functions, etc
const app = express();
const mongoose = require("mongoose");
// The Dotenv NPM package facilitates the loading and use of .env variables in the code.
const dotenv = require("dotenv");
// Cross-origin resource sharing (CORS) allows AJAX requests to skip same-origin policy
// and access resources from remote hosts. 
const cors = require("cors");
// It "reads" the body of incoming JSON requests that will be sent by the website to the REST API
const bodyParser = require("body-parser");
// It "reads" the cookie data that is sent to authenticate requests to the REST API
const cookieParser = require("cookie-parser");
// Importing the config.js file to be able to use two of the
// key-value pairs inside the config{} object. 
const config = require("./config.js");
// initiates the .env configuration file
dotenv.config();
// overriding the port by setting an environment variable 
const port = process.env.port || 5001;
const helmet = require("helmet");
// This variable holds a template literal containing the connection string that connects
// the /admin/rest-api app to the MongoDB coding-blog project and specifically to the blog database
// The connection strings requires Authentication credentials. They are provided via environment variables.
const mongoString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@coding-blog.nk8osod.mongodb.net/blog?retryWrites=true&w=majority`;

mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on("error", function (error) {
    if (process.env.NODE_ENV === "development") {
        console.log(error);
    }
});

mongoose.connection.on("open", function () {
    console.log("Connected to MongoDB database.");
});

// An Express middleware that utilises the cors NPM package
app.use(helmet());

// An Express middleware that utilises the cors NPM package
// The origin option tells cors what domain or URL to allow requests from.
// The ternary operator is used as a substitute for an if...else statement
// that sets the value to accept requets from depending on the application environment
// The credentials options configures the Access-Control-Allow-Credentials CORS header.
// By setting it to true, it will allow for sending cookie data back and forth
// between the browser to the admin REST API. 
app.use(cors({
    origin: process.env.NODE_ENV === "development" ? config.devAdminURL : /admin.petarpandzharov.com$/,
    credentials: true
}));

// The first middleware will allow the REST API app to parse JSON data sent to it
// The limit option overrides the default request body size, which is 100kb and increases it to 50mb.
// The increased body size will be needed when uploading images and blog posts with lots of content. 
app.use(bodyParser.json({ limit: "50mb" }));
// The second middleware will allow the REST API to parse urlencoded request bodies. 
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
// This middleware function calls the cookieParser variable
// and will parse cookie data sent to the API endpoints and populate req.cookies with 
// an object keyed by the cookie names.
app.use(cookieParser());
// listen() binds and listens for connections on the specified host and port
// the host is the app binding and the specified port is 5001

// Telling Express to use the API route file. The Express application now direct requests to the URL endpoints defined in the file below.
app.use(require("./routes/admin-user/index.js"));
// Telling Express to use the API route file. The Express application now direct requests to the URL endpoints defined in the file below.
app.use(require("./routes/blog-posts/index.js"));
// Telling Express to use the API route file. The Express application now direct requests to the URL endpoints defined in the file below.
app.use(require("./routes/images/index.js"));
// Telling Express to use the API route file. The Express application now direct requests to the URL endpoints defined in the file below.
app.use(require("./routes/sitemap/index.js"));

app.listen(port, () => {
    console.log(`Express started on http://localhost:${port}; ` +
        "press Ctrl-C to terminate.");
});
