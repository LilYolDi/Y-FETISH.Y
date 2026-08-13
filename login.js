document.addEventListener("DOMContentLoaded", () => {

    const container =
        document.getElementById(
            "telegramLogin"
        );

    const message =
        document.getElementById(
            "loginMessage"
        );


    /*
     * УКАЖИ ЗДЕСЬ USERNAME СВОЕГО TELEGRAM-БОТА
     *
     * Например:
     *
     * const BOT_USERNAME = "YNewLoginBot";
     *
     */

    const BOT_USERNAME =
        window.Y_NEW_TELEGRAM_BOT_USERNAME ||
        "YOUR_TELEGRAM_BOT_USERNAME";


    /*
     * Проверяем настройку
     */

    if (
        !BOT_USERNAME ||
        BOT_USERNAME ===
        "YOUR_TELEGRAM_BOT_USERNAME"
    ) {

        if (message) {

            message.textContent =
                "Укажите username Telegram-бота в login.js.";

        }

        return;
    }


    /*
     * Создаём Telegram Login Widget
     */

    const script =
        document.createElement("script");


    script.src =
        "https://telegram.org/js/telegram-widget.js?22";


    script.async = true;


    script.setAttribute(
        "data-telegram-login",
        BOT_USERNAME
    );


    script.setAttribute(
        "data-size",
        "large"
    );


    script.setAttribute(
        "data-userpic",
        "true"
    );


    script.setAttribute(
        "data-request-access",
        "write"
    );


    /*
     * Telegram вызовет эту функцию
     * после успешной авторизации.
     */

    script.setAttribute(
        "data-onauth",
        "onTelegramAuth(user)"
    );


    container.innerHTML = "";

    container.appendChild(script);


    /*
     * Telegram вызывает функцию глобально.
     */

    window.onTelegramAuth =
        async function (user) {

            if (!user) {

                showError(
                    "Telegram не передал данные."
                );

                return;
            }


            try {

                showMessage(
                    "Авторизация..."
                );


                const response =
                    await fetch(
                        "/api/auth/telegram",
                        {
                            method: "POST",

                            credentials:
                                "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(user)
                        }
                    );


                const data =
                    await response.json()
                        .catch(() => ({}));


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Не удалось выполнить вход."
                    );
                }


                showSuccess(
                    "Вы успешно вошли."
                );


                /*
                 * После авторизации
                 * сразу переходим к анкетам.
                 */

                setTimeout(() => {

                    window.location.href =
                        "/profiles.html";

                }, 500);


            } catch (error) {

                console.error(error);


                showError(
                    error.message ||
                    "Ошибка авторизации."
                );
            }
        };


    function showMessage(text) {

        if (!message) {
            return;
        }

        message.textContent =
            text;

        message.style.color =
            "#777777";
    }


    function showSuccess(text) {

        if (!message) {
            return;
        }

        message.textContent =
            text;

        message.style.color =
            "#35d04f";
    }


    function showError(text) {

        if (!message) {
            return;
        }

        message.textContent =
            text;

        message.style.color =
            "#e50914";
    }

});