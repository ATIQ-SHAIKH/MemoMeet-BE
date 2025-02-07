module.exports = {
    USER_ROUTES: {
        ROOT: "/user",
        PUBLIC: {
            ROOT: "/public",
            SIGNUP_INVITE: "/signup/invite",
            SIGNUP_SET_PASSWORD: "/signup/set/password",
            LOGIN: "/login",
            SIGN_IN: "/signin",
        },
        PRIVATE: {
            ROOT: "/private",
            CHECK_SESSION: "/check/session",
            LOGOUT: "/logout",
            CREATE_MEET_CODE: "/create/meet/code"
        }
    }
}