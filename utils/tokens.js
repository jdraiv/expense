const jwt = require('jsonwebtoken');


function decodeJWT(reqObject) {
    return jwt.decode(reqObject.signedCookies["expense-jwt"], "supersecret");
}


function decodeRTK(reqObject) {
    return jwt.decode(reqObject.signedCookies["expense-rtk"], "supersecret");
}


function createJWT(id) {
    return jwt.sign({userID: id, exp: Math.floor(Date.now() / 1000) + (60 * 15)}, "supersecret");
}


function createRTK(id) {
    return jwt.sign({userID: id}, "supersecret", {expiresIn: '360h'});
}


module.exports.decodeJWT = decodeJWT;
module.exports.decodeRTK = decodeRTK;
module.exports.createJWT = createJWT;
module.exports.createRTK = createRTK;