
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const maxRating = 4.1;

const file1Path = path.join(__dirname, 'result', 'unique_ids_13.06.2025.csv');
const outputFilePath = path.join(__dirname, 'result', 'unique_apps_13.06.2025.json');


processCSV(file1Path).catch(error => {
    console.error('Произошла ошибка:', error);
});

async function processCSV(filePath) {
    // Чтение CSV файла
    const csvData = fs.readFileSync(filePath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    // Массив для хранения результатов
    const results = [];
    var count = lines.length;

    for (const line of lines) {
        count--;

        const link = line.trim();
        const appId = extractAppId(link);

        if (!appId) {
            console.error(`Не удалось извлечь ID из ссылки: ${link}`);
            continue;
        }

        try {
            const appData = await getAppDataByAppId(appId);

            if (appData == null) {
                continue;
            }

            const feed = await GetComments(appId);
            var negativeReview = null;

            if (!feed || !feed.entry || !Array.isArray(feed.entry)) {
                console.error(`Нет отзывов для приложения с ID: ${appId}`);
                continue;
            } else {
                // Поиск первого отзыва с рейтингом <= 3
                negativeReview = feed.entry.find(review => {
                    const rating = review['im:rating']?.label;
                    return rating && parseInt(rating, 10) <= 3 && review.content?.label;
                });
            }

            if (appData.averageUserRating > maxRating) {
                continue;
            }

            // Добавляем результат в массив
            results.push({
                Link: link,
                AppName: appData.trackName,
                RatingsNumber: appData.userRatingCountForCurrentVersion,
                AverageRating: appData.averageUserRating,
                LastNegativeRatingText: negativeReview ? negativeReview.content.label : '',
                LastNegativeRating: negativeReview ? negativeReview['im:rating'].label : ''
            });

            console.error(`[${results.length}] new item: rating=${appData.averageUserRating} | wait ${count} links \n===============================`);

        } catch (error) {
            console.error(`Ошибка при обработке приложения с ID: ${appId}`, error.message);
        }
    }

    // Записываем результаты в JSON файл
    fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Результаты успешно записаны в файл: ${outputFilePath}`);
}


async function getAppDataByAppId(appId) {
    try {
        // Construct the API URL with the provided App ID
        const apiUrl = `https://itunes.apple.com/lookup?id=${appId}`;

        // Fetch data from the iTunes API
        const response = await fetch(apiUrl);

        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status}`);
        }

        // Parse the JSON response
        const data = await response.json();

        // Check if the result contains any data
        if (data.resultCount === 0) {
            throw new Error(`No app found with the given App ID [${appId}]`);
        }

        // Return the app name
        return data.results[0];
    } catch (error) {
        console.error("An error occurred:", error.message);
        return null;
    }
}

async function GetComments(appId) {
    const reviewsUrl = `https://itunes.apple.com/us/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`;
    const response = await axios.get(reviewsUrl);
    return response.data.feed;
}

function extractAppId(url) {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
}