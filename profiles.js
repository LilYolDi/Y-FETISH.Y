document.addEventListener("DOMContentLoaded", function () {

    const country = document.getElementById("country");
    const city = document.getElementById("city");
    const goal = document.getElementById("goal");

    const searchButton = document.getElementById("searchButton");
    const resetButton = document.getElementById("resetButton");

    const count = document.getElementById("count");
    const empty = document.getElementById("empty");

    const normalProfiles =
        document.getElementById("normalProfiles");

    const allStaticCards =
        document.querySelectorAll(".profile-card");

    const cities = {

        "Украина": [
            "Киев",
            "Одесса",
            "Львов",
            "Ивано-Франковск",
            "Днепр",
            "Харьков",
            "Запорожье"
        ],

        "Россия": [
            "Москва",
            "Санкт-Петербург",
            "Казань",
            "Екатеринбург",
            "Новосибирск"
        ]

    };

    let databaseAds = [];


    // =========================
    // ГОРОДА
    // =========================

    function updateCities() {

        const selectedCountry = country.value;

        city.innerHTML = `
            <option value="all">
                Все города
            </option>
        `;

        if (selectedCountry === "all") {

            const allCities = [
                ...cities["Украина"],
                ...cities["Россия"]
            ];

            allCities.forEach(function (cityName) {

                const option =
                    document.createElement("option");

                option.value = cityName;
                option.textContent = cityName;

                city.appendChild(option);

            });

            return;
        }

        if (cities[selectedCountry]) {

            cities[selectedCountry].forEach(function (cityName) {

                const option =
                    document.createElement("option");

                option.value = cityName;
                option.textContent = cityName;

                city.appendChild(option);

            });

        }

    }


    // =========================
    // ЗАГРУЗКА ОБЪЯВЛЕНИЙ
    // =========================

    async function loadDatabaseAds() {

        try {

            const response =
                await fetch("/api/ads");

            if (!response.ok) {
                throw new Error("Ошибка загрузки объявлений");
            }

            databaseAds =
                await response.json();

            databaseAds.forEach(function (ad) {

                createAdCard(ad);

            });

            updateCount();

        } catch (error) {

            console.error(
                "Ошибка загрузки объявлений:",
                error
            );

        }

    }


    // =========================
    // СОЗДАНИЕ КАРТОЧКИ
    // =========================

    function createAdCard(ad) {

        if (!normalProfiles) {
            return;
        }

        const card =
            document.createElement("div");

        card.className =
            "profile-card database-profile-card";

        card.dataset.country =
            ad.country || "";

        card.dataset.city =
            ad.city || "";

        card.dataset.goal =
            ad.goal || "";

        card.dataset.vip =
            "false";


        const image =
            document.createElement("img");

        image.src =
            ad.photo || "images/1.jpg";

        image.alt =
            ad.title || "Анкета";

        image.onerror = function () {

            this.src = "images/1.jpg";

        };


        const info =
            document.createElement("div");

        info.className =
            "profile-info";


        const title =
            document.createElement("h3");

        title.textContent =
            ad.title  ad.city  "Анкета";


        const description =
            document.createElement("p");

        description.textContent =
            ad.description ||
            "Описание анкеты";

    const button =
            document.createElement("button");

        button.type =
            "button";

        button.textContent =
            "Подробнее";


        info.appendChild(title);
        info.appendChild(description);
        info.appendChild(button);

        card.appendChild(image);
        card.appendChild(info);

        normalProfiles.appendChild(card);

    }


    // =========================
    // ПОИСК
    // =========================

    function searchProfiles() {

        const selectedCountry =
            country.value;

        const selectedCity =
            city.value;

        const selectedGoal =
            goal.value;

        let found = 0;


        const allCards =
            document.querySelectorAll(
                ".profile-card"
            );


        allCards.forEach(function (card) {

            const cardCountry =
                card.dataset.country;

            const cardCity =
                card.dataset.city;

            const cardGoal =
                card.dataset.goal;


            const countryMatch =
                selectedCountry === "all" ||
                cardCountry === selectedCountry;


            const cityMatch =
                selectedCity === "all" ||
                cardCity === selectedCity;


            const goalMatch =
                selectedGoal === "all" ||
                cardGoal === selectedGoal;


            if (
                countryMatch &&
                cityMatch &&
                goalMatch
            ) {

                card.style.display = "";

                found++;

            } else {

                card.style.display =
                    "none";

            }

        });


        count.textContent =
            found;


        if (found === 0) {

            empty.classList.remove(
                "hidden"
            );

        } else {

            empty.classList.add(
                "hidden"
            );

        }

    }


    // =========================
    // КНОПКА НАЙТИ
    // =========================

    searchButton.addEventListener(
        "click",
        function () {

            searchProfiles();

        }
    );


    // =========================
    // СБРОС
    // =========================

    resetButton.addEventListener(
        "click",
        function () {

            country.value = "all";

            updateCities();

            city.value = "all";

            goal.value = "all";


            const allCards =
                document.querySelectorAll(
                    ".profile-card"
                );


            allCards.forEach(
                function (card) {

                    card.style.display = "";

                }
            );


            updateCount();

            empty.classList.add(
                "hidden"
            );

        }
    );


    // =========================
    // СТРАНА
    // =========================

    country.addEventListener(
        "change",
        function () {

            updateCities();

            city.value = "all";

        }
    );


    // =========================
    // МЕНЮ
    // =========================

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const closeMenu =
        document.getElementById(
            "closeMenu"
        );

    const sideMenu =
        document.getElementById(
            "sideMenu"
        );

    const menuOverlay =
        document.getElementById(
            "menuOverlay"
        );


    function openMenu() {

        sideMenu.classList.add(
            "active"
        );

        menuOverlay.classList.add(
            "active"
        );

    }


    function closeSideMenu() {

        sideMenu.classList.remove(
            "active"
        );

        menuOverlay.classList.remove(
            "active"
        );

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
            closeSideMenu
        );

    }


    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            closeSideMenu
        );

    }


    // =========================
    // ВЫХОД
    // =========================

    const logout =
        document.getElementById(
            "logout"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "telegramUser"
                );

                window.location.href =
                    "./index.html";

            }
        );

    }


    // =========================
    // СЧЁТЧИК
    // =========================

    function updateCount() {

        const allCards =
            document.querySelectorAll(
                ".profile-card"
            );

        let visible = 0;


        allCards.forEach(
            function (card) {

                if (
                    card.style.display !==
                    "none"
                ) {

                    visible++;

                }

            }
        );


        count.textContent =
            visible;

    }


    // =========================
    // ЗАПУСК
    // =========================

    updateCities();

    updateCount();

    loadDatabaseAds();

});
