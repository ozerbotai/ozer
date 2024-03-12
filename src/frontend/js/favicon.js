/* Favicon  */
document.addEventListener("DOMContentLoaded", function () {
  function updateFavicon() {
    const favicon = document.getElementById("favicon");
    const isDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const timestamp = new Date().getTime();

    if (isDarkMode) {
      favicon.href = `../../img/favicon-light.svg?${timestamp}`;
    } else {
      favicon.href = `../../img/favicon-dark.svg?${timestamp}`;
    }
  }

  updateFavicon();

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", updateFavicon);
});
