const jwt = require("jsonwebtoken");
const { JWT_SECRET_USER } = require("../config");

function userMiddleware(req,res,next){
     const token = req.headers.token;
     if (!token) {
        return res.status(401).json({ message: "Missing token" });
     }
     try {
        const decoded = jwt.verify(token, JWT_SECRET_USER);
        req.userId = decoded.id;
        return next();
     } catch (e) {
        return res.status(403).json({
            message:"you are not signed in"
        });
     }

}
module.exports = {
    userMiddleware : userMiddleware
}