const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Define the date range
const startDate = new Date('2024-04-01');
const endDate = new Date('2025-04-01');

// Function to format a date as yyyy-mm-dd
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to extract links and save to CSV
async function extractLinksAndSaveToCSV() {
    const csvFilePath = path.join(__dirname, 'extracted_links.csv');
    const stream = fs.createWriteStream(csvFilePath);

    // Write CSV header
    const uniqueLinks = new Set();
    stream.write('Link\n');

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = formatDate(currentDate);
        const url = `https://appadvice.com/apps-gone-free/${formattedDate}`;

        try {
            console.log(`Fetching data for ${formattedDate}...`);

            // Fetch the HTML content of the page
            const response = await axios.get(url);
            const html = response.data;

            // Parse the HTML using Cheerio
            const $ = cheerio.load(html);

            // Find all <a> elements with the specified class
            $('a.aa_agf__main__btn.aa_agf__main__btn--free').each((index, element) => {
                const href = $(element).attr('href');
                if (href) {
                    var id = (href.split("app/")[1]).replace("id","");
                    var link = `https://apps.apple.com/us/app/id${id}\n`;

                    if(!uniqueLinks.has(href)){
                        uniqueLinks.add(href);
                        stream.write(link);
                    }
                }
            });
        } catch (error) {
            console.error(`Error fetching data for ${formattedDate}:`, error.message);
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Close the CSV file stream
    stream.end();
    console.log(`Extraction complete. Links saved to ${csvFilePath}`);
}

// Run the script
extractLinksAndSaveToCSV();