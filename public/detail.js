document.querySelector("[data-confirm]")?.addEventListener("submit", (event) => {
  if (!window.confirm("이 행사를 삭제할까요? 댓글과 좋아요도 함께 삭제돼요.")) {
    event.preventDefault();
  }
});
