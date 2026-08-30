const form = document.getElementById("searchBar");
const input = document.getElementById("keyword");
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const keyword = input.value.trim();
  if (!keyword) return;
  window.location.href = `/searchFeed?keyword=${encodeURIComponent(keyword)}`;
});


