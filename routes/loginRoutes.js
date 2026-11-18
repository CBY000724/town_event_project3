const router = require("express").Router();
const login = require("../controllers/loginController");

router.get("/login", login.login);
router.post("/login", login.loginUser);
router.get("/register", login.register);
router.post("/register", login.registerUser);
router.post("/logout", login.logout);

module.exports = router;