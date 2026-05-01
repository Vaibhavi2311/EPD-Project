const user = localStorage.getItem("user");

if (user && window.location.pathname.includes("login")) {
  window.location.href = "admin.html";
}