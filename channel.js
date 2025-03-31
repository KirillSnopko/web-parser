const fs = require('fs');
const cheerio = require('cheerio');
const { createObjectCsvWriter } = require('csv-writer');

// Function to parse the HTML and extract data
function parseHtml(html) {
    const $ = cheerio.load(html);
    const items = [];

    // Find all card elements
    $('.peer-item-box').each((index, element) => {
        const item = {};

        // Extract channel name from href
        const channelLink = $(element).find('a[href*="/channel/"]').attr('href');
        const channelNameMatch = channelLink?.match(/@(\w+)/);
        item.channelName = channelNameMatch ? `@${channelNameMatch[1]}` : null;

        // Extract number of subscribers
        const subscriberElement = $(element).find('.font-12.text-truncate');
        item.subscribers = subscriberElement.text().trim().replace(/[^0-9 ]/g, '');

        // Extract description
        const descriptionElement = $(element).find('.font-14.text-muted.line-clamp-2.mt-1');
        item.description = descriptionElement.text().trim();

        // Add item to the list
        if (item.channelName && item.subscribers && item.description) {
            items.push(item);
        }
    });

    return items;
}

// Function to write data to CSV
async function writeCsv(data, outputPath) {
    const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: [
            { id: 'channelName', title: 'Канал' },
            { id: 'subscribers', title: 'ПДП' },
            { id: 'description', title: 'ОПИСАНИЕ' },
        ],
    });

    await csvWriter.writeRecords(data);
    console.log(`Data successfully written to ${outputPath}`);
}

// Main function
async function main() {
    try {
        // Read the HTML file
        const htmlFile = 'input.html'; // Replace with your HTML file path
        const htmlContent = fs.readFileSync(htmlFile, 'utf-8');

        // Parse the HTML content
        const parsedData = parseHtml(htmlContent);

        // Write the parsed data to a CSV file
        const csvOutputFile = 'channel.csv'; // Replace with your desired output file path
        await writeCsv(parsedData, csvOutputFile);
    } catch (error) {
        console.error("Error processing the file:", error);
    }
}

// Run the main function
main();