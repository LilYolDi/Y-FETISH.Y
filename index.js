document.addEventListener("DOMContentLoaded", () => {
    /*
     * Стартовая страница.
     * Небольшая задержка позволяет показать страницу,
     * после чего пользователь может перейти к анкетам.
     */

    const button = document.querySelector(".start-button");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        window.location.href = "/profiles.html";
    });
});