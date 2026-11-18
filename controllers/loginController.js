const bcrypt = require("bcrypt");
const users = require("../models/userModel");
const { cookieOptions, signIn } = require("../middlewares/checkLogin");

const passwordHashForUnknownUser = bcrypt.hashSync(require("node:crypto").randomUUID(), 10);

function showForm(res, view, status = 200, username = "", error = "", registered = false) {
  return res.status(status).render(view, { title: view === "login" ? "로그인" : "회원가입", username, error, registered });
}

function login(req, res) {
  if (req.user) return res.redirect("/");
  showForm(res, "login", 200, "", "", req.query.registered === "1");
}

function register(req, res) {
  if (req.user) return res.redirect("/");
  showForm(res, "register");
}

function readCredentials(body = {}) {
  return {
    username: typeof body.username === "string" ? body.username.trim() : "",
    password: typeof body.password === "string" ? body.password : "",
  };
}

function validUsername(username) {
  return username.length >= 3 && username.length <= 30 && !/\s/u.test(username);
}

async function registerUser(req, res) {
  if (req.user) return res.redirect(303, "/");
  const { username, password } = readCredentials(req.body);
  if (!validUsername(username)) {
    return showForm(res, "register", 422, username.slice(0, 30), "아이디는 공백 없이 3~30자로 입력해 주세요.");
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return showForm(res, "register", 422, username, "비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.");
  }
  if (password !== req.body.password2) {
    return showForm(res, "register", 422, username, "비밀번호 확인이 일치하지 않아요.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  if (!users.create(username, passwordHash)) {
    return showForm(res, "register", 409, username, "이미 사용 중인 아이디예요.");
  }
  res.redirect(303, "/login?registered=1");
}

async function loginUser(req, res) {
  if (req.user) return res.redirect(303, "/");
  const { username, password } = readCredentials(req.body);
  if (!validUsername(username) || !password || Buffer.byteLength(password, "utf8") > 72) {
    return showForm(res, "login", 401, username.slice(0, 30), "아이디 또는 비밀번호를 확인해 주세요.");
  }

  const user = users.findByUsername(username);
  const matches = await bcrypt.compare(password, user?.password_hash ?? passwordHashForUnknownUser);
  if (!user || !matches) {
    return showForm(res, "login", 401, username, "아이디 또는 비밀번호를 확인해 주세요.");
  }

  signIn(res, { id: user.id, nickname: user.nickname });
  res.redirect(303, "/");
}

function logout(req, res) {
  res.clearCookie("event_session", cookieOptions);
  res.redirect(303, "/");
}

module.exports = { login, register, registerUser, loginUser, logout };
