document.addEventListener('DOMContentLoaded', async function () {

    const normalProfiles = document.getElementById('normalProfiles');
    const count = document.getElementById('count');
    const citySelect = document.getElementById('city');
    const countrySelect = document.getElementById('country');
    const goalSelect = document.getElementById('goal');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const empty = document.getElementById('empty');

    let ads = [];

    async function loadAds() {
        try {
            const response = await fetch('/api/ads');

            if (!response.ok) {
                throw new Error('Не удалось загрузить объявления');
            }

            ads = await response.json();

            updateCities(ads);
            renderAds(ads);

        } catch (error) {
            console.error('Ошибка загрузки объявлений:', error);
            count.textContent = '0';
            normalProfiles.innerHTML = '';
            empty.classList.remove('hidden');
        }
    }

    function renderAds(list) {

        normalProfiles.innerHTML = '';

        count.textContent = list.length;

        if (list.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');

        list.forEach(function (ad) {

            const card = document.createElement('div');

            card.className = 'profile-card';

            card.dataset.country = ad.country || '';
            card.dataset.city = ad.city || '';
            card.dataset.goal = ad.goal || '';
            card.dataset.vip = 'false';

            const image = document.createElement('img');

            image.src = ad.photo || 'images/1.jpg';
            image.alt = ad.title || 'Анкета';

            image.onerror = function () {
                this.src = 'images/1.jpg';
            };

            const info = document.createElement('div');

            info.className = 'profile-info';

            const title = document.createElement('h3');

            title.textContent = ad.title  ad.city  'Без имени';

            const description = document.createElement('p');

            description.textContent =
                ad.description || 'Описание анкеты';

            const button = document.createElement('button');

            button.type = 'button';
            button.textContent = 'Подробнее';

            info.appendChild(title);
            info.appendChild(description);
            info.appendChild(button);

            card.appendChild(image);
            card.appendChild(info);

            normalProfiles.appendChild(card);
        });
    }

    function updateCities(list) {

        if (!citySelect) {
            return;
        }

        const currentCity = citySelect.value;

        citySelect.innerHTML = '';

        const allOption = document.createElement('option');

        allOption.value = 'all';
        allOption.textContent = 'Все города';

        citySelect.appendChild(allOption);

        const cities = [...new Set(
            list
                .map(ad => ad.city)
                .filter(city => city)
        )];

        cities.sort();

        cities.forEach(function (city) {

            const option = document.createElement('option');

            option.value = city;
            option.textContent = city;

            citySelect.appendChild(option);
        });

        if (cities.includes(currentCity)) {
            citySelect.value = currentCity;
        }
    }

    function filterAds() {

        const country =
            countrySelect ? countrySelect.value : 'all';

        const city =
            citySelect ? citySelect.value : 'all';

        const goal =
            goalSelect ? goalSelect.value : 'all';

        const filtered = ads.filter(function (ad) {

            const countryMatch =
                country === 'all' ||
                ad.country === country;

            const cityMatch =
