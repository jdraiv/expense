const jwt = require('jsonwebtoken');


function decodeJWT(reqObject) {
    return jwt.decode(reqObject.signedCookies["expense-jwt"], process.env.JWT_KEY);
}


function decodeRTK(reqObject) {
    return jwt.decode(reqObject.signedCookies["expense-rtk"], process.env.RTK_KEY);
}


function createJWT(id) {
    return jwt.sign({userID: id, exp: Math.floor(Date.now() / 1000) + (60 * 15)}, process.env.JWT_KEY);
}


function createRTK(id) {
    return jwt.sign({userID: id}, process.env.RTK_KEY, {expiresIn: '360h'});
}


module.exports.decodeJWT = decodeJWT;
module.exports.decodeRTK = decodeRTK;
module.exports.createJWT = createJWT;
module.exports.createRTK = createRTK;