const events = require("../models/eventModel");

function feed(req, res) {
  const selected = events.categories.includes(req.query.category) ? req.query.category : "전체";
  const query = typeof req.query.q === "string" ? req.query.q.slice(0, 100) : "";
  const term = query.trim().toLowerCase();
  const all = events.list();
  const matches = all.filter((event) =>
    (selected === "전체" || selected === event.category) &&
    (event.title + " " + event.location).toLowerCase().includes(term)
  );
  res.render("feed", {
    title: "행사 둘러보기", categories: events.categories, selected, query, matches, count: all.length,
  });
}

function list(req, res) {
  res.json(events.list());
}

function loadEvent(req, res, next) {
  const id = Number(req.params.id);
  const event = Number.isSafeInteger(id) && id > 0 && events.find(id, req.user?.id ?? null);
  if (!event) return res.status(404).render("message", { title: "행사를 찾을 수 없어요." });
  req.event = event;
  next();
}

function requireOwner(req, res, next) {
  if (req.user.id !== req.event.user_id) {
    return res.status(403).render("message", { title: "작성자만 이 작업을 할 수 있어요." });
  }
  next();
}

function detail(req, res) {
  res.render("detail", {
    title: req.event.title, event: req.event, comments: events.comments(req.event.id),
  });
}

function renderForm(res, event, error) {
  res.status(error ? 422 : 200).render("event-form", {
    title: event.id ? "행사 수정" : "행사 등록",
    event, categories: events.categories, error,
  });
}

function form(req, res) {
  renderForm(res, req.event || {});
}

function save(req, res) {
  const { event, valid } = events.validate(req.body || {});
  const id = req.event?.id;
  if (!valid) return renderForm(res, { ...event, id }, "입력한 내용과 행사 날짜를 확인해 주세요.");
  if (id) {
    events.update(event, id, req.user.id);
    return res.redirect(303, "/events/" + id);
  }
  res.redirect(303, "/events/" + events.create(event, req.user.id));
}

function remove(req, res) {
  events.remove(req.event.id, req.user.id);
  res.redirect(303, "/");
}

function like(req, res) {
  events.setLike(req.event.id, req.user.id, req.body.liked === "1");
  res.redirect(303, "/events/" + req.event.id);
}

function comment(req, res) {
  const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
  if (!body || body.length > 300) {
    return res.status(422).render("message", { title: "댓글은 1~300자로 작성해 주세요." });
  }
  events.addComment(req.event.id, req.user.id, body);
  res.redirect(303, "/events/" + req.event.id + "#comments");
}

module.exports = { feed, list, loadEvent, requireOwner, detail, form, save, remove, like, comment };
