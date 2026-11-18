const router = require("express").Router();
const event = require("../controllers/eventController");
const { requireLogin } = require("../middlewares/checkLogin");

router.param("id", event.loadEvent);
router.get("/", event.feed);
router.get("/api/events", event.list);
router.get("/events/new", requireLogin, event.form);
router.post("/events", requireLogin, event.save);
router.get("/events/:id", event.detail);
router.get("/events/:id/edit", requireLogin, event.requireOwner, event.form);
router.post("/events/:id/edit", requireLogin, event.requireOwner, event.save);
router.post("/events/:id/delete", requireLogin, event.requireOwner, event.remove);
router.post("/events/:id/like", requireLogin, event.like);
router.post("/events/:id/comments", requireLogin, event.comment);

module.exports = router;
