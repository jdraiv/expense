const jwt = require('jsonwebtoken');


function decodeJWT(reqObject) {
    return jwt.decode(reqObject.signedCookies["expense-jwt"], "supersecret");
}


function decodeRTK(reqObject) {
    return jwt.decode(reqObject.signedCookies["expense-jwt"], "supersecret");
}


module.exports.decodeJWT = decodeJWT;
module.exports.decodeRTK = decodeRTK;