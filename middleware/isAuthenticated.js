
const jwt = require('jsonwebtoken');


function isAuthenticated(req, res, next) {
    const errorMesssage = "Not authorized";
    const jsonToken = req.signedCookies['expense-jwt'];
    const refreshToken = req.signedCookies['expense-rtk'];

    // If the tokens are not falsy
    if (jsonToken && refreshToken) {
        jwt.verify(jsonToken, 'supersecret', (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    /*
                        If the JSON token is expired, we can generate a new one ONLY IF the refresh token is not expired or blacklisted
                    */
                    jwt.verify(refreshToken, 'supersecret', (err, decoded) => {
                        // We won't be able to refresh the token if there is an error
                        if (err) {
                            res.send({"status": "error", "message": errorMesssage})
                        }
                        else {
                            const newJsonToken = jwt.sign({userID: decoded.userID, exp: Math.floor(Date.now() / 1000) + (60 * 15)}, 'supersecret');
                            const newRefreshToken = jwt.sign({userID: decoded.userID}, 'supersecret', {expiresIn: '360h'});
                            
                            // Saving the new tokens
                            res.cookie('expense-jwt', newJsonToken, {signed: true, httpOnly: true});
                            res.cookie('expense-rtk', newRefreshToken, {signed: true, httpOnly: true});
    
                            console.log("Tokens have been refreshed!")
                            next();
                        }
                    });
                } 
                else {
                    res.send({"status": "error", "message": errorMesssage});
                }
            }
            else {
                // If the token is valid, the user can access the data
                next();
            }
        });
    }
    else {
        res.send({"status": "error", "message": errorMesssage});
    }
};

module.exports.isAuthenticated = isAuthenticated;