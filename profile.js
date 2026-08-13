document.addEventListener("DOMContentLoaded", () => {

    const container =
        document.getElementById("profileContainer");

    const errorBlock =
        document.getElementById("profileError");

    const menu =
        document.getElementById("menu");

    const menuButton =
        document.getElementById("menuButton");

    const closeMenu =
        document.getElementById("closeMenu");

    const logout =
        document.getElementById("logout");

    const account =
        document.getElementById("account");


    /*
     * Меню
     */

    menuButton?.addEventListener(
        "click",
        () => {
            menu?.classList.add("open");
        }
    );


    closeMenu?.addEventListener(
        "click",
        () => {
            menu?.classList.remove("open");
        }
    );


    /*
     * ID анкеты
     */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");


    if (!id) {

        showError();

        return;
    }


    /*
     * Получение пользователя
     */

    async function getCurrentUser() {

        try {

            const response =
                await fetch(
                    "/api/auth/me",
                    {
                        credentials: "include"
                    }
                );

            if (!response.ok) {
                return null;
            }

            const data =
                await response.json();

            return data.user || null;

        } catch {
            return null;
        }
    }


    /*
     * Аккаунт
     */

    function renderAccount(user) {

        if (!account) {
            return;
        }

        if (!user) {

            account.innerHTML = `
                <a
                    href="/register/"
                    class="login-button"
                >
                    Войти через Telegram
                </a>
            `;

            return;
        }


        account.innerHTML = `
            <div class="user">

                ${
                    user.photo_url
                        ? `
                            <img
                                src="${escapeHtml(user.photo_url)}"
                                alt=""
                            >
                        `
                        : ""
                }

                <span>
                    ${escapeHtml(
                        user.first_name ||
                        user.username ||
                        "Пользователь"
                    )}
                </span>

            </div>
        `;
    }


    /*
     * Загрузка анкеты
     */

    async function loadProfile() {

        try {

            const response =
                await fetch(
                    /api/profiles/${encodeURIComponent(id)},
                    {
                        credentials: "include"
                    }
                );


            if (!response.ok) {
                throw new Error(
                    "Profile not found"
                );
            }


            const data =
                await response.json();


            const profile =
                data.profile || data;


            renderProfile(profile);


        } catch (error) {

            console.error(error);

            showError();
        }
    }


    /*
     * Отрисовка анкеты
     */

    function renderProfile(profile) {

        if (!container) {
            return;
        }


        const photo =
            profile.photo ||
            profile.photo_url ||
            "/default-avatar.png";


        const name =
            profile.name ||
            "Без имени";


        const age =
            profile.age
                ? , ${profile.age}
                : "";


        const location =
            [
                profile.country,
                profile.city
            ]
            .filter(Boolean)
            .join(", ");


        const goal =
            profile.goal ||
            "Не указано";
			
			
const description =
            profile.description ||
            "Пользователь не добавил описание.";


        container.innerHTML = `

            <article class="profile-box">

                <div class="profile-photo">

                    <img
                        src="${escapeHtml(photo)}"
                        alt="${escapeHtml(name)}"
                        onerror="this.src='/default-avatar.png'"
                    >

                </div>


                <div class="profile-info">

                    <h1 class="profile-name">
                        ${escapeHtml(name)}${escapeHtml(age)}
                    </h1>


                    <div class="profile-location">
                        ${escapeHtml(
                            location ||
                            "Место не указано"
                        )}
                    </div>


                    <div class="profile-goal">
                        ${escapeHtml(goal)}
                    </div>


                    <div class="profile-description-title">
                        О себе
                    </div>


                    <div class="profile-description">
                        ${escapeHtml(description)}
                    </div>


                    <div class="telegram-info">
                        Связаться с пользователем можно
                        через доступные способы связи,
                        указанные в анкете.
                    </div>

                </div>

            </article>
        `;
    }


    /*
     * Ошибка
     */

    function showError() {

        if (container) {
            container.innerHTML = "";
        }

        errorBlock?.classList.remove("hidden");
    }


    /*
     * Выход
     */

    logout?.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(error);

            }

            window.location.href =
                "/profiles.html";
        }
    );


    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    async function init() {

        const user =
            await getCurrentUser();

        renderAccount(user);

        await loadProfile();
    }


    init();

});