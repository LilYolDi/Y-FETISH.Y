require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const supabase = createClient(
    'https://cfdopweyymgwcgfynmbx.supabase.co',
    process.env.SUPABASE_KEY
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
            city
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Y-New запущен на порту ${PORT}`);
});