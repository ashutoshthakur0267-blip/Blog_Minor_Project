const { validateToken } = require("../services/authentication");
const User = require("../models/user");

function checkForAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) return next();

    try {
      const userPayload = validateToken(tokenCookieValue);
      // Fetch the full user from DB to get fullname, email, etc.
      const user = await User.findById(userPayload._id).lean();
      req.user = user;
    } catch (error) {
      console.error("❌ Invalid Token");
      req.user = null;
    }

    next();
  };
}

module.exports = {
  checkForAuthenticationCookie,
};
