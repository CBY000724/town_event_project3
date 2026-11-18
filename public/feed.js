if (window.React && window.ReactDOM) {
  const h = React.createElement;
  const categories = ["전체", "동네 행사", "캠퍼스", "팝업"];

  function EventRow({ event }) {
    const [, month, day] = event.event_date.split("-");
    return h("article", { className: "event-row" },
      h("a", { href: "/events/" + event.id },
        h("time", { className: "event-date", dateTime: event.event_date, "aria-label": event.event_date },
          h("span", null, Number(month) + "월"), h("strong", null, day)
        ),
        h("div", { className: "event-body" },
          h("span", { className: "tag" }, event.category),
          h("h2", null, event.title),
          h("p", null, event.location)
        ),
        h("span", { className: "event-meta", "aria-label": "좋아요 " + event.like_count + "개" }, "♡ ", event.like_count)
      )
    );
  }

  function Feed({ initialQuery, initialCategory, events }) {
    const [query, setQuery] = React.useState(initialQuery);
    const [category, setCategory] = React.useState(initialCategory);
    const term = query.trim().toLowerCase();
    const matches = events.filter((event) =>
      (category === "전체" || event.category === category) &&
      (event.title + " " + event.location).toLowerCase().includes(term)
    );

    const results = matches.length > 0
      ? h("div", { className: "event-list" }, matches.map((event) => h(EventRow, { key: event.id, event })))
      : h("div", { className: "empty-state" },
        h("h2", null, events.length ? "검색 결과가 없어요" : "아직 등록된 행사가 없어요"),
        h("p", null, events.length ? "행사 이름이나 장소를 바꿔 검색해 보세요." : "알리고 싶은 행사가 있다면 첫 소식을 올려 보세요."),
        events.length
          ? h("button", { type: "button", className: "outline", onClick: () => { setQuery(""); setCategory("전체"); } }, "전체 행사 보기")
          : h("a", { className: "outline", href: "/events/new" }, "첫 행사 등록")
      );

    return h(React.Fragment, null,
      h("div", { className: "filters" },
        h("div", { className: "chips", role: "group", "aria-label": "행사 분류" },
          categories.map((value) => h("button", {
            key: value, type: "button", "aria-pressed": category === value,
            onClick: () => setCategory(value),
          }, value))
        ),
        h("div", { className: "search" },
          h("input", {
            type: "search", placeholder: "행사 이름 또는 장소", "aria-label": "행사 검색",
            maxLength: 100, value: query, onChange: (event) => setQuery(event.target.value),
          })
        )
      ),
      h("div", { "aria-live": "polite" }, results)
    );
  }

  const root = document.getElementById("event-feed");
  fetch("/api/events").then((response) => {
    if (!response.ok) throw new Error("Could not load events");
    return response.json();
  }).then((events) => {
    if (root.contains(document.activeElement)) return;
    ReactDOM.createRoot(root).render(h(Feed, {
      events, initialQuery: root.dataset.query, initialCategory: root.dataset.category,
    }));
  }).catch(() => {
    // Keep the server-rendered search form available.
  });
}
