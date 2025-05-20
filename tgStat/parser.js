const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Пути к файлам
const htmlFilePath = path.resolve(__dirname, 'input.html');
const csvFilePath = path.resolve(__dirname, 'output.csv');

// Чтение HTML файла
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

// Загрузка HTML в Cheerio
const $ = cheerio.load(htmlContent);

// Массив для хранения результатов
const results = [];

// Поиск всех карточек каналов
$('.channels-list .peer-item-row').each((i, element) => {
    const $card = $(element);

    // 1. Название канала
    let name = '';
    const nameEl = $card.find('.text-truncate.font-16.text-dark.mt-n1');
    if (nameEl.length > 0) {
        name = nameEl.text().trim();
    }

    // 2. Никнейм из ссылки
    let nickname = '';
    const linkEl = $card.find('a[href*="tgstat.com"]');
    if (linkEl.length > 0) {
        const href = linkEl.attr('href') || '';
        const cleanHref = href.replace(/\s+/g, ''); // убираем лишние пробелы
        const match = cleanHref.match(/@([\w\-]+)/i);
        if (match) {
            nickname = `@${match[1]}`;
        }
    }

    // 3. Подписчики: ищем h4, содержащее "подписчиков" или рядом с ним
    let subscribers = '';
    $card.find('*').each((j, el) => {
        const text = $(el).text().trim();
        if (text.includes('подписчиков')) {
            const prev = $(el).prev().text().trim();
            const num = prev.replace(/[^\d]/g, '');
            if (num) {
                subscribers = num;
                return false; // break
            }
        }
    });

    if (!subscribers) {
        // Альтернативный поиск по любому элементу с числом
        $card.find('h4, div, span').each((j, el) => {
            const text = $(el).text().trim();
            if (/^\s*\d[\d\s]*\s*$/.test(text)) {
                subscribers = text.replace(/[^\d]/g, '');
                return false;
            }
        });
    }

    if (name && nickname && subscribers) {
        results.push({ name, nickname, subscribers });
    } else {
        console.log(`⚠️ Пропущена запись #${i + 1}`);
        console.log({ name, nickname, subscribers });
    }
});

// Генерация CSV
let csv = 'Name,Nickname,Subscribers\n';
results.forEach(row => {
    csv += `"${row.name}","${row.nickname}","${row.subscribers}"\n`;
});

// Запись в файл
fs.writeFileSync(csvFilePath, csv, 'utf8');

console.log(`✅ Обработано ${results.length} записей. Результат сохранён в ${csvFilePath}`);