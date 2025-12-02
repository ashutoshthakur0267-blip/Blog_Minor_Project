const { Router } = require("express");
const router = Router();
const User = require("../models/user");

// ✅ Render pages
router.get("/signin", (req, res) => 
  res.render("signin", {
    user: req.user || null, // pass user to nav.ejs
    error: null             // no error initially
  })
);

router.get("/signup", (req, res) => 
  res.render("signup", {
    user: req.user || null, // pass user to nav.ejs
    error: null             // no error initially
  })
);

// ✅ SIGNIN POST
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await User.matchPasswordAndGenerateToken(email, password);
    console.log("✅ Token Generated:", token);
    return res.cookie("token", token).redirect("/");
  } catch (err) {
    console.error("❌ Signin Error:", err.message);
    return res.render("signin", {
      user: req.user || null,   // pass user for nav
      error: "Incorrect Email or Password"
    });
  }
});

// ✅ SIGNUP POST
router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    await User.create({ fullname, email, password });
    return res.redirect("/");
  } catch (err) {
    console.error("❌ Signup Error:", err.message);
    return res.render("signup", {
      user: req.user || null,
      error: "Error during signup. Try again."
    });
  }
});

router.get("/logout",(req,res)=>{
    res.clearCookie("token").redirect("/");
})

module.exports = router;
