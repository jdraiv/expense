const jwt = require('jsonwebtoken');


function getTokens(requestObject) {
    try {
        return JSON.parse(requestObject.headers.authorization);

    }
    catch(err) {
        console.log(err);
    }
}


function decodeJWT(token) {
    return jwt.decode(token, process.env.JWT_KEY);
}


function decodeRTK(token) {
    return jwt.decode(token, process.env.RTK_KEY);
}


function onlyGetUserID(requestObject) {
    const availableTokens = getTokens(requestObject);

    return decodeJWT(availableTokens["expense-jwt"])['userID']
}


function createJWT(id) {
    return jwt.sign({userID: id, exp: Math.floor(Date.now() / 1000) + (60 * 15)}, process.env.JWT_KEY);
}


function createRTK(id) {
    return jwt.sign({userID: id}, process.env.RTK_KEY, {expiresIn: '360h'});
}


module.exports.getTokens = getTokens;
module.exports.onlyGetUserID = onlyGetUserID;
module.exports.decodeJWT = decodeJWT;
module.exports.decodeRTK = decodeRTK;
module.exports.createJWT = createJWT;
module.exports.createRTK = createRTK;