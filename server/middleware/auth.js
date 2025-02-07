const jwt = require("jsonwebtoken");
const { GENERAL: GENERAL_MESSAGES, USER_SIGNUP: USER_SIGNUP_MESSAGES, USER_LOGIN: USER_LOGIN_MESSAGES } = require("../constants/messages");
const RESPONSES = require("../constants/responseCodes");

const jwtAuth = async (req, res, next) => {
    console.log(req.cookies)
    if (!req?.cookies?.token) {
        return res
            .status(RESPONSES.FORBIDDEN)
            .json({ msg: GENERAL_MESSAGES.UNAUTHORIZED });
    }
    // const token = req.headers.authorization.split(" ")[1] || "";
    const token = req.cookies.token;
    if (!token) {
        return res
            .status(RESPONSES.FORBIDDEN)
            .json({ msg: GENERAL_MESSAGES.UNAUTHORIZED });
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        if (!decoded || !decoded?._id || !decoded?.email) return res
            .status(RESPONSES.FORBIDDEN)
            .json({ msg: GENERAL_MESSAGES.UNAUTHORIZED });
        req.user = decoded;
        next();
    } catch (err) {
        console.log(err);
        res.status(RESPONSES.UNAUTHORIZED).json({ msg: GENERAL_MESSAGES.UNAUTHORIZED });
    }
};

const jwtSign = async (obj) => {
    const signature = jwt.sign(obj, process.env.TOKEN_KEY);
    return signature;
};

module.exports = {
    jwtAuth,
    jwtSign
}