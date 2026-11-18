const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const cookieParser = require("cookie-parser");
const { loadUser, verifyForm } = require("./middlewares/checkLogin");

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET을 설정해 주세요.");

const app = express();
app.locals.user = null;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
app.use(cookieParser());
app.use(loadUser);
app.use(verifyForm);
app.use(require("./routes/loginRoutes"));
app.use(require("./routes/eventRoutes"));
app.use((req, res) => res.status(404).render("message", { title: "페이지를 찾을 수 없어요." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (!error.status || error.status >= 500) console.error(error);
  const status = error.status || 500;
  res.status(status).render("message", { title: status >= 500 ? "요청을 처리하지 못했어요." : "요청 내용을 확인해 주세요." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("동네소식 서버 · 포트 " + port));
