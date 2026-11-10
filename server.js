require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'profiles.html'));
});

app.use(express.static(__dirname));



app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(
`User-agent: *
Allow: /

Sitemap: https://y-fetish-y.onrender.com/sitemap.xml`
    );
});



const supabase = createClient(
    'https://cfdopweyymgwcgfynmbx.supabase.co',
    process.env.SUPABASE_KEY
);

const supabaseText = createClient(
    'https://cdyuxiicllnfrwssigsr.supabase.co',
    process.env.SUPABASE_TEXT_KEY
);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Проверка сервера
app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Y-New server работает'
    });
});

// Получить объявления
app.get('/api/ads', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Ошибка Supabase:', error);

            return res.status(500).json({
                error: error.message,
                code: error.code
            });
        }

        res.json(data);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Публикация объявления + фото
app.post('/api/ads', upload.single('photo'), async (req, res) => {
    try {
        const {
          title,
          description,
          city,
          telegram,
          channel
        } = req.body;

        if (!title || !description || !city) {
            return res.status(400).json({
                error: 'Заполни имя, описание и город'
            });
        }

        let photoUrl = null;

        // Загружаем фотографию в Supabase Storage
        if (req.file) {
            const extension =
                path.extname(req.file.originalname) || '.jpg';

           const fileName =
                       Date.now() + '-' +
                       Math.random().toString(36).slice(2) +
                       extension;

            const { error: uploadError } = await supabase
                .storage
                .from('ads-photos')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error(
                    'Ошибка загрузки фото:',
                    uploadError
                );

                return res.status(500).json({
                    error: uploadError.message
                });
            }

            const { data: publicUrlData } =
                supabase
                    .storage
                    .from('ads-photos')
                    .getPublicUrl(fileName);

            photoUrl = publicUrlData.publicUrl;
        }

        // Сохраняем объявление в таблицу ads
        const { data, error } = await supabase
            .from('ads')
            .insert([
                {
                  title: title,
                  description: description,
                  city: city,
                  telegram: telegram,
                  channel: channel,
                  photo: photoUrl
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Ошибка Supabase:', error);

            return res.status(500).json({
                error: error.message,
                code: error.code
            });
        }

        res.status(201).json({
            success: true,
            message: 'Объявление опубликовано!',
            ad: data
        });

    } catch (error) {
        console.error('Ошибка сервера:', error);

        res.status(500).json({
            error: error.message
        });
    }
});



// ==========================================
// ТЕКСТОВЫЕ АНКЕТЫ — ВТОРАЯ СТРАНИЦА
// ==========================================

// Получить текстовые анкеты
app.get('/api/text-ads', async (req, res) => {
    try {

        const { data, error } = await supabaseText
            .from('text_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Ошибка Supabase text_profiles:', error);

            return res.status(500).json({
                error: error.message,
                code: error.code
            });
        }

        res.json(data);

    } catch (error) {

        console.error('Ошибка:', error);

        res.status(500).json({
            error: error.message
        });

    }
});


// Создать текстовую анкету
app.post('/api/text-ads', async (req, res) => {
    try {

        const {
            title,
            type,
            city,
            description,
            telegram
        } = req.body;

        if (!title || !type || !city || !description) {
            return res.status(400).json({
                error: 'Заполни название, кто ты, город и текст анкеты'
            });
        }

        if (type !== 'Госпожа' && type !== 'Раб') {
            return res.status(400).json({
                error: 'Неверно выбран тип анкеты'
            });
        }

        const { data, error } = await supabaseText
            .from('text_profiles')
            .insert([
                {
                    title: title.trim(),
                    type: type,
                    city: city.trim(),
                    description: description.trim(),
                    telegram: telegram
                        ? telegram.trim()
                        : null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Ошибка Supabase text_profiles:', error);

            return res.status(500).json({
                error: error.message,
                code: error.code
            });
        }

        res.status(201).json({
            success: true,
            message: 'Текстовая анкета опубликована!',
            ad: data
        });

    } catch (error) {

        console.error('Ошибка создания текстовой анкеты:', error);

        res.status(500).json({
            error: error.message
        });

    }
});




// ==========================================
// РЕГИСТРАЦИЯ И ВХОД ПО EMAIL И ПАРОЛЮ
// ==========================================

function getCookie(req, name) {
    const cookies = (req.headers.cookie || "").split(";");

    const cookie = cookies.find(item =>
        item.trim().startsWith(name + "=")
    );

    return cookie
        ? decodeURIComponent(cookie.trim().slice(name.length + 1))
        : null;
}

function setAuthCookies(res, session) {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res.cookie("yf_auth", session.access_token, options);
    res.cookie("yf_refresh", session.refresh_token, options);
}

function clearAuthCookies(res) {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };

    res.clearCookie("yf_auth", options);
    res.clearCookie("yf_refresh", options);
}

// РЕГИСТРАЦИЯ
app.post("/api/auth/register", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Введите правильный email."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Пароль должен содержать минимум 8 символов."
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        if (data.session) {
            setAuthCookies(res, data.session);

            return res.status(201).json({
                success: true,
                authenticated: true,
                message: "Регистрация завершена!"
            });
        }

        return res.status(201).json({
            success: true,
            authenticated: false,
            message: "Проверьте почту и подтвердите регистрацию."
        });

    } catch (error) {
        console.error("Ошибка регистрации:", error);

        res.status(500).json({
            message: "Ошибка сервера при регистрации."
        });
    }
});

// ВХОД
app.post("/api/auth/login", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password
            });

        if (error || !data.session) {
            return res.status(401).json({
                message: "Неверный email или пароль."
            });
        }

        setAuthCookies(res, data.session);

        res.json({
            success: true,
            message: "Вы успешно вошли."
        });

    } catch (error) {
        console.error("Ошибка входа:", error);

        res.status(500).json({
            message: "Ошибка сервера при входе."
        });
    }
});

// ПРОВЕРКА АВТОРИЗАЦИИ
app.get("/api/auth/me", async (req, res) => {
    try {
        let accessToken = getCookie(req, "yf_auth");
        const refreshToken = getCookie(req, "yf_refresh");

        if (!accessToken) {
            return res.status(401).json({ user: null });
        }

        let { data, error } =
            await supabase.auth.getUser(accessToken);

        // Обновляем истёкшую сессию
        if (error && refreshToken) {
            const refreshed =
                await supabase.auth.refreshSession({
                    refresh_token: refreshToken
                });

            if (refreshed.data.session) {
                setAuthCookies(res, refreshed.data.session);

                data = refreshed.data;
                error = null;
            }
        }

        if (error || !data.user) {
            clearAuthCookies(res);

            return res.status(401).json({
                user: null
            });
        }

        res.json({
            user: {
                id: data.user.id,
                email: data.user.email
            }
        });

    } catch (error) {
        console.error("Ошибка проверки аккаунта:", error);

        res.status(500).json({
            user: null
        });
    }
});

// ВЫХОД
app.post("/api/auth/logout", (req, res) => {
    clearAuthCookies(res);

    res.json({
        success: true
    });
});




const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Y-New запущен на порту ${PORT}`);
});
