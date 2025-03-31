const fs = require('fs');
const cheerio = require('cheerio');
const { createObjectCsvWriter } = require('csv-writer');

// Функция парсинга HTML
function parseHtml(html) {
    const $ = cheerio.load(html);
    var results = [];

    $('.peer-item-box').each((_, el) => {
        const item = {};

        const channelLink = $(el).find('a[href*="/chat/"]').attr('href');
        const channelNameMatch = channelLink?.match(/@(\w+)/);
        item.chat = channelNameMatch ? `@${channelNameMatch[1]}` : channelLink;

        // Извлекаем ссылку на чат
       /* const link = $(el).find('a.text-body').attr('href');
        item.chat = `@${link.match(/@([^/]+)/)[1]}`;*/

        // Описание
        item.description = $(el)
            .find('.font-14.text-muted.line-clamp-2.mt-1')
            .text().trim();

        // Участники
        item.participants = $(el)
            .find('.font-12.text-truncate')
            .text().trim()
            .replace(/[^0-9 ]/g, '');

        try {
            results.push(item);
        } catch (error) {
            console.log(error);
        }
    });

    return results;
}

// Функция записи в CSV
async function writeCSV(data) {
    const csvWriter = createObjectCsvWriter({
        path: 'chats.csv',
        header: [
            { id: 'chat', title: 'ЧАТ' },
            { id: 'participants', title: 'ПДП' },
            { id: 'description', title: 'ОПИСАНИЕ' }
        ]
    });

    await csvWriter.writeRecords(data);
    console.log('Данные сохранены в chats.csv');
}

// Основная функция
async function main() {
    try {
        // Читаем HTML из файла
        const html = fs.readFileSync('input.html', 'utf8');

        // Парсим данные
        const data = parseHtml(html);

        // Вывод в консоль
        console.log('Парсинг завершен:');
        data.forEach(item => {
            console.log(`\nЧат: ${item.chat}`);
            console.log(`Участников: ${item.participants}`);
            console.log(`Описание: ${item.description}`);
        });

        // Запись в CSV
        await writeCSV(data);
    } catch (err) {
        console.error('Ошибка:', err.message);
    }
}

main();