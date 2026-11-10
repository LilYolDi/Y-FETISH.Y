
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

const SUPABASE_URL = 'https://cfdopweyymgwcgfynmbx.supabase.co';

const supabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Секретный ключ используется только на сервере для операций с ads и Storage.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Не задан SUPABASE_SERVICE_ROLE_KEY в переменных Render');
}

const supabaseAdmin = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
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

// ==========================================
// АВТОРИЗАЦИЯ И ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ
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

async function getAuthenticatedUser(req, res) {
    let accessToken = getCookie(req, "yf_auth");
    const refreshToken = getCookie(req, "yf_refresh");

    if (!accessToken) {
        return null;
    }

    let { data, error } = await supabase.auth.getUser(accessToken);

    if (error && refreshToken) {
        const refreshed = await supabase.auth.refreshSession({
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
        return null;
    }

    return data.user;
}

// Проверка сервера
app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Y-New server работает'
    });
});

// ==========================================
// ОБЪЯВЛЕНИЯ
// ==========================================

// Получить все опубликованные объявления
app.get('/api/ads', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
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

// Получить только свои анкеты
app.get('/api/my-ads', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req, res);

        if (!user) {
            return res.status(401).json({
                error: 'Необходимо войти в аккаунт'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('ads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Ошибка получения своих анкет:', error);

            return res.status(500).json({
                error: error.message,
                code: error.code
            });
        }

        res.json(data);

    } catch (error) {
        console.error('Ошибка /api/my-ads:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Публикация объявления + фото
app.post('/api/ads', upload.single('photo'), async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req, res);

        if (!user) {
            return res.status(401).json({
                error: 'Для публикации анкеты необходимо войти в аккаунт'
            });
        }

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
        let uploadedFileName = null;

        // Загружаем фотографию в Supabase Storage
        if (req.file) {
            const extension =
                path.extname(req.file.originalname) || '.jpg';

            const fileName =
                Date.now() + '-' +
                Math.random().toString(36).slice(2) +
                extension;

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('ads-photos')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Ошибка загрузки фото:', uploadError);

                return res.status(500).json({
                    error: uploadError.message
                });
            }

            uploadedFileName = fileName;

            const { data: publicUrlData } = supabaseAdmin
                .storage
                .from('ads-photos')
                .getPublicUrl(fileName);

            photoUrl = publicUrlData.publicUrl;
        }

        // Сохраняем объявление с ID владельца
        const { data, error } = await supabaseAdmin
            .from('ads')
            .insert([
                {
                    title: title,
                    description: description,
                    city: city,
                    telegram: telegram,
                    channel: channel,
                    photo: photoUrl,
                    user_id: user.id
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Ошибка Supabase:', error);

            // Удаляем загруженное фото, если запись не сохранилась
            if (uploadedFileName) {
                await supabaseAdmin
                    .storage
                    .from('ads-photos')
                    .remove([uploadedFileName]);
            }

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

// Удалить свою анкету
app.delete('/api/ads/:id', async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req, res);

        if (!user) {
            return res.status(401).json({
                error: 'Необходимо войти в аккаунт'
            });
        }

        const adId = req.params.id;

        if (!adId) {
            return res.status(400).json({
                error: 'Не указан ID анкеты'
            });
        }

        // Удаляем только запись, принадлежащую текущему пользователю
        const { data, error } = await supabaseAdmin
            .from('ads')
            .delete()
            .eq('id', adId)
            .eq('user_id', user.id)
            .select('id, photo')
            .maybeSingle();

        if (error) {
            console.error('Ошибка удаления анкеты:', error);

            return res.status(500).json({
                error: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                error: 'Анкета не найдена или не принадлежит вашему аккаунту'
            });
        }

        // Удаляем фотографию из Storage
        if (data.photo) {
            try {
                const photoUrl = new URL(data.photo);
                const marker = '/storage/v1/object/public/ads-photos/';

                const markerIndex = photoUrl.pathname.indexOf(marker);

                if (markerIndex !== -1) {
                    const fileName = decodeURIComponent(
                        photoUrl.pathname.slice(markerIndex + marker.length)
                    );

                    if (fileName && !fileName.includes('..')) {
                        const { error: photoError } = await supabaseAdmin
                            .storage
                            .from('ads-photos')
                            .remove([fileName]);

                        if (photoError) {
                            console.error(
                                'Не удалось удалить фотографию:',
                                photoError
                            );
                        }
                    }
                }
            } catch (photoError) {
                console.error('Ошибка обработки фотографии:', photoError);
            }
        }

        res.json({
            success: true,
            message: 'Анкета удалена'
        });

    } catch (error) {
        console.error('Ошибка удаления:', error);

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
        const user = await getAuthenticatedUser(req, res);

        if (!user) {
            return res.status(401).json({
                user: null
            });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email
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

// ==========================================
// ЗАПУСК СЕРВЕРА
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Y-New запущен на порту ${PORT}`);
});
