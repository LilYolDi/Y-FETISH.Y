document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("publishForm");
    const photo = document.getElementById("photo");
    const photoPreview = document.getElementById("photoPreview");

    const country = document.getElementById("country");
    const city = document.getElementById("city");

    const description = document.getElementById("description");
    const descriptionCount = document.getElementById("descriptionCount");

    const submitButton = document.getElementById("submitButton");

    const formError = document.getElementById("formError");
    const formSuccess = document.getElementById("formSuccess");
    const authMessage = document.getElementById("authMessage");

    const menu = document.getElementById("sideMenu");
    const menuButton = document.getElementById("menuButton");
    const closeMenu = document.getElementById("closeMenu");
    const overlay = document.getElementById("menuOverlay");


    /*
     * =========================
     * ГОРОДА
     * =========================
     */

    const cities = {

        "Украина": [
            "Киев",
            "Львов",
            "Одесса",
            "Днепр",
            "Харьков",
            "Запорожье",
            "Винница",
            "Полтава",
            "Черкассы",
            "Ивано-Франковск"
        ],

        "Россия": [
            "Москва",
            "Санкт-Петербург",
            "Казань",
            "Екатеринбург",
            "Новосибирск",
            "Нижний Новгород",
            "Самара",
            "Ростов-на-Дону",
            "Краснодар",
            "Воронеж"
        ]

    };


    /*
     * =========================
     * ВЫБОР СТРАНЫ / ГОРОДА
     * =========================
     */

    country.addEventListener("change", () => {

        city.innerHTML = "";

        const firstOption = document.createElement("option");

        firstOption.value = "";
        firstOption.textContent = "Выберите город";

        city.appendChild(firstOption);

        const selected = country.value;

        if (!selected) {
            return;
        }

        const list = cities[selected] || [];

        list.forEach((cityName) => {

            const option = document.createElement("option");

            option.value = cityName;
            option.textContent = cityName;

            city.appendChild(option);

        });

    });


    /*
     * =========================
     * ПРЕДПРОСМОТР ФОТО
     * =========================
     */

    photo.addEventListener("change", () => {

        const file = photo.files[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            showError(
                "Можно загружать только JPG, PNG или WebP."
            );

            photo.value = "";
            photoPreview.innerHTML = "";

            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {

            showError(
                "Размер фотографии не должен превышать 5 МБ."
            );

            photo.value = "";
            photoPreview.innerHTML = "";

            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {

            photoPreview.innerHTML = `
                <img
                    src="${event.target.result}"
                    alt="Предпросмотр"
                >
            `;

        };

        reader.readAsDataURL(file);

        clearMessages();

    });


    /*
     * =========================
     * СЧЁТЧИК ОПИСАНИЯ
     * =========================
     */

    description.addEventListener("input", () => {

        descriptionCount.textContent =
            description.value.length;

    });


    /*
     * =========================
     * МЕНЮ
     * =========================
     */

    function openMenu() {

        menu.classList.add("open");
        overlay.classList.
		
		
	add("visible");

        document.body.style.overflow = "hidden";

    }


    function closeMenuFunc() {

        menu.classList.remove("open");
        overlay.classList.remove("visible");

        document.body.style.overflow = "";

    }


    if (menuButton) {
        menuButton.addEventListener(
            "click",
            openMenu
        );
    }


    if (closeMenu) {
        closeMenu.addEventListener(
            "click",
            closeMenuFunc
        );
    }


    if (overlay) {
        overlay.addEventListener(
            "click",
            closeMenuFunc
        );
    }


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeMenuFunc();
        }

    });


    /*
     * =========================
     * ПРОВЕРКА АВТОРИЗАЦИИ
     * =========================
     */

    async function checkAuth() {

        try {

            const response = await fetch(
                "/api/auth/me",
                {
                    credentials: "include"
                }
            );


            if (!response.ok) {

                showAuthRequired();

                return false;
            }


            const data = await response.json();


            if (!data.user) {

                showAuthRequired();

                return false;
            }


            hideAuthRequired();

            return true;


        } catch (error) {

            console.error(
                "Ошибка проверки авторизации:",
                error
            );

            /*
             * Если server.js временно не содержит
             * /api/auth/me, форму не блокируем.
             */

            hideAuthRequired();

            return true;
        }

    }


    function showAuthRequired() {

        if (authMessage) {
            authMessage.classList.remove("hidden");
        }

        if (form) {
            form.classList.add("hidden");
        }

    }


    function hideAuthRequired() {

        if (authMessage) {
            authMessage.classList.add("hidden");
        }

        if (form) {
            form.classList.remove("hidden");
        }

    }


    /*
     * =========================
     * ОТПРАВКА ФОРМЫ
     * =========================
     */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessages();


        /*
         * HTML-проверка формы
         */

        if (!form.checkValidity()) {

            form.reportValidity();

            return;
        }


        /*
         * ПРОВЕРКА ВОЗРАСТА
         */

        const age = Number(
            document.getElementById("age").value
        );


        if (age < 18 || age > 99) {

            showError(
                "Возраст должен быть от 18 до 99 лет."
            );

            return;
        }


        /*
         * ПРОВЕРКА ЦЕЛИ ЗНАКОМСТВА
         */

        const selectedGoal =
            document.querySelector(
                'input[name="goal"]:checked'
            );


        if (!selectedGoal) {

            showError(
                "Выберите цель знакомства."
            );

            return;
        }


        /*
         * FORM DATA
         */

        const formData = new FormData(form);

        formData.set(
            "goal",
            selectedGoal.value
        );


        /*
         * КНОПКА
         */

        submitButton.disabled = true;

        submitButton.textContent =
            "Публикуем...";


        try {

            const response = await fetch(
                "/api/profiles",
                {
                    method: "POST",

                    body: formData,

                    credentials: "include"
                }
            );


            const data = await readResponse(
                response
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Не удалось опубликовать анкету."
                );
            }
			
			
	/*
             * УСПЕШНАЯ ПУБЛИКАЦИЯ
             */

            showSuccess(
                "Анкета успешно опубликована."
            );


            /*
             * Переход к анкетам
             */

            setTimeout(() => {

                window.location.href =
                    "./profiles.html";

            }, 900);


        } catch (error) {

            console.error(
                "Ошибка публикации:",
                error
            );


            showError(
                error.message ||
                "Произошла ошибка при публикации анкеты."
            );


            submitButton.disabled = false;

            submitButton.textContent =
                "Опубликовать анкету";

        }

    });


    /*
     * =========================
     * ОШИБКА
     * =========================
     */

    function showError(message) {

        formError.textContent = message;

        formError.classList.remove("hidden");

        formSuccess.classList.add("hidden");

        formError.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /*
     * =========================
     * УСПЕХ
     * =========================
     */

    function showSuccess(message) {

        formSuccess.textContent = message;

        formSuccess.classList.remove("hidden");

        formError.classList.add("hidden");

    }


    /*
     * =========================
     * ОЧИСТКА СООБЩЕНИЙ
     * =========================
     */

    function clearMessages() {

        formError.classList.add("hidden");

        formSuccess.classList.add("hidden");

    }


    /*
     * =========================
     * ЧТЕНИЕ ОТВЕТА СЕРВЕРА
     * =========================
     */

    async function readResponse(response) {

        const type =
            response.headers.get("content-type") || "";


        if (
            type.includes("application/json")
        ) {

            return await response.json();

        }


        const text =
            await response.text();


        return {
            message: text
        };

    }


    /*
     * =========================
     * START
     * =========================
     */

    checkAuth();

});



document.addEventListener("DOMContentLoaded", function () {

    const menuButton = document.getElementById("menuButton");
    const closeMenu = document.getElementById("closeMenu");
    const sideMenu = document.getElementById("sideMenu");
    const menuOverlay = document.getElementById("menuOverlay");

    function openMenu() {
        sideMenu.classList.add("open");
        menuOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeMenuFunc() {
        sideMenu.classList.remove("open");
        menuOverlay.classList.remove("open");
        document.body.style.overflow = "";
    }

    menuButton.addEventListener("click", openMenu);

    closeMenu.addEventListener("click", closeMenuFunc);

    menuOverlay.addEventListener("click", closeMenuFunc);

});