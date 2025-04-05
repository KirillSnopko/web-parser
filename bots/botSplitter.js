const fs = require('fs');
const path = require('path');

// Define the category mapping
const categoryMapping = {
    2: 'Game',
    15: 'For group meters',
    3: 'Chats and dating',
    7: 'Downloaders',
    5: 'Music',
    4: 'Films',
    6: 'Books',
    10: 'Horoscopes',
    8: 'Stickers',
    9: 'Themes',
    11: 'Voices',
    12: 'Tests',
    14: 'Ai',
    13: 'Tools',
    1: 'Other'
};

const inputFilePath = 'bots.json'; // Path to your JSON file
const outputDir = 'output'; // Directory to save CSV files
splitBotUsernamesByCategory(inputFilePath, outputDir);

function saveCsvToFile(data, filePath) {
    fs.writeFileSync(filePath, data);
    console.log(`Saved CSV file: ${filePath}`);
}

// Main function to process the JSON file
function splitBotUsernamesByCategory(inputFilePath, outputDir) {
    // Read the JSON file
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Group botUsernames by category
    const groupedData = {};
    jsonData.forEach(item => {
        const categoryName = categoryMapping[item.category];
        if (!groupedData[categoryName]) {
            groupedData[categoryName] = [];
        }
        groupedData[categoryName].push(item.botUsername);
    });

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert each group to CSV and save to a file
    for (const [categoryName, usernames] of Object.entries(groupedData)) {
        const csvData = `botUsername\n${usernames.map(username => `"${username}"`).join('\n')}`;
        const fileName = `${categoryName.replace(/\s+/g, '_')}.csv`;
        const filePath = path.join(outputDir, fileName);
        saveCsvToFile(csvData, filePath);
    }
}

