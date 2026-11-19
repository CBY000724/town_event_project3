const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const sessionAudience = "town-events-" + crypto.randomUUID();
const cookieOptions = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" };

function loadUser(req, res, next) {
  res.set("Cache-Control", "no-store");
  req.user = null;
  if (req.cookies.event_session) {
    try {
      req.user = jwt.verify(req.cookies.event_session, process.env.JWT_SECRET, {
        issuer: "town-events", audience: sessionAudience, algorithms: ["HS256"],
      });
    } catch {
      res.clearCookie("event_session", cookieOptions);
    }
  }
  res.locals.user = req.user;
  res.locals.formToken = req.user?.formToken;
  next();
}

function verifyForm(req, res, next) {
  if (req.method === "POST" && req.user && req.body?.formToken !== req.user.formToken) {
    return res.status(403).render("message", { title: "페이지를 새로고침한 뒤 다시 시도해 주세요." });
  }
  next();
}

function requireLogin(req, res, next) {
  if (!req.user) return res.redirect(303, "/login");
  next();
}

function signIn(res, user) {
  const token = jwt.sign({ ...user, formToken: crypto.randomUUID() }, process.env.JWT_SECRET, {
    issuer: "town-events", audience: sessionAudience, expiresIn: "1h",
  });
  res.cookie("event_session", token, { ...cookieOptions, maxAge: 3600000 });
}

module.exports = { cookieOptions, loadUser, verifyForm, requireLogin, signIn };
