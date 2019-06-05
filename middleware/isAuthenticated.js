
const jwt = require('jsonwebtoken');
const tokenUtils = require("../utils/tokens.js")


function isAuthenticated(req, res, next) {
    const errorMesssage = "No Credentials";

    try {
        if (!req.headers.authorization) {
            res.send({"status": "error", "message": errorMesssage})
        }
        else {
            const tokens = tokenUtils.getTokens(req);
            const jsonToken = tokens["expense-jwt"];
            const refreshToken = tokens["expense-rtk"];

            // If the tokens are not falsy
            if (jsonToken && refreshToken) {
                jwt.verify(jsonToken, process.env.JWT_KEY, (err, decoded) => {
                    if (err) {
                        if (err.name === "TokenExpiredError") {
                            /*
                                If the JSON token is expired, we can generate a new one ONLY IF the refresh token is not expired or blacklisted
                            */
                            jwt.verify(refreshToken, process.env.RTK_KEY, (err, decoded) => {
                                // We won't be able to refresh the token if there is an error
                                if (err) {
                                    res.send({"status": "error", "message": errorMesssage})
                                }
                                else {
                                    const newJsonToken = tokenUtils.createJWT(decoded.userID);
                                    const newRefreshToken = tokenUtils.createRTK(decoded.userID);
                                    
                                    // Tokens must be refreshed
                                    res.send({
                                        "status": "refresh", 
                                        "message": "Please refresh the tokens", 
                                        "data": {
                                            "expense-jwt": newJsonToken, 
                                            "expense-rtk": newRefreshToken
                                        }
                                    });
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
        }
    }
    catch (err) {
        res.send({"status": "error", "message": "Unknown error"});
    }
};

module.exports.isAuthenticated = isAuthenticated;