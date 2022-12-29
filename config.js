// A const (the value of a constant cannot be changed) variable in an object
// named config, which stores different URLS related to the application
const config = {
    devAdminURL: "http://localhost:3001",
    proAdminURL: "https://www.admin.petarpandzharov.com",
    devFrontendWebsiteURL: "http://localhost:3000",
    prodFrontendWebsiteURL: "https://www.petarpandzharov.com"
}

module.exports = config;

// Going forward, if I need to use one of these variables in the code, 
// I can require() the config.js file and access any of the variables like this:
// config.devAdminURL