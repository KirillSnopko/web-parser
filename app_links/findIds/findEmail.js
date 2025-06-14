const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

// Path to your JSON file
const filePath = path.join(__dirname, 'result', 'missing_unique_apps_14.06.2025.json');
const outputFilePath = path.join(__dirname, 'result', 'email_unique_apps_14.06.2025.json');
processJsonFile(filePath);


// Main function to process the JSON file
async function processJsonFile(filePath) {

  fs.writeFileSync(outputFilePath, JSON.stringify({ test: true }, null, 2), 'utf8');

  try {
    // Read the JSON file
    const rawData = fs.readFileSync(filePath, 'utf8');
    var apps = JSON.parse(rawData);

    var count = apps.length;

    // Process each app object
    for (const app of apps) {
      console.log(`Processing app: ${app.AppName} ==========> осталось обработать ${count} ссылок`);
      count--;

      try {
        // Fetch the app page
        const response = await axios.get(app.Link);
        const appPageHtml = response.data;

        // Extract the privacy policy link
        const privacyPolicyLink = extractPrivacyPolicyLink(appPageHtml);
        if (!privacyPolicyLink) {
          console.log(`No privacy policy link found for app: ${app.AppName}`);
          continue;
        }

        console.log(`Found privacy policy link: ${privacyPolicyLink}`);

        // Fetch the privacy policy page
        const privacyResponse = await axios.get(privacyPolicyLink);
        const privacyPageHtml = privacyResponse.data;

        // Extract all email addresses
        const emails = extractEmailsFromHTML(privacyPageHtml);
        if (emails.length > 0) {
          console.log(`Found emails: ${emails.join(', ')}`);
          app.Email = emails; // Store all emails as an array
        } else {
          console.log(`No emails found for app: ${app.AppName}`);
        }
      } catch (error) {
        console.error(`Error processing app: ${app.AppName}`, error.message);
      }
    }

    apps = apps.filter(x => x.Email != null);

    // Save the updated JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(apps, null, 2), 'utf8');
    console.log('Updated JSON file saved successfully.');
  } catch (error) {
    console.error('Error reading or processing the JSON file:', error.message);
  }
}

// Function to extract the first privacy policy link from HTML
function extractPrivacyPolicyLink(html) {
  const $ = cheerio.load(html);
  var privacyPolicyLink = $('a[href*="privacy-policy.html"]').attr('href') ?? $('a[href*="privacy-policy"]').attr('href');
  if (privacyPolicyLink == null) {
    try {
      const privacyPolicyRegex = /"privacyPolicyUrl":"(https?:\/\/[^\s"]+)"/;
      const match = html.match(privacyPolicyRegex);
      if (!match) return null;

      // Extract the URL and remove the trailing slash if present
      privacyPolicyLink = match[1];
      if (privacyPolicyLink.endsWith('/')) {
        privacyPolicyLink = privacyPolicyLink.slice(0, -1); // Remove trailing slash
      }
    } catch (ex) {

    }
  }

  if (privacyPolicyLink.includes('wixpress')) {
    console.log(`Ignoring privacy policy link containing 'wixpress': ${privacyPolicyLink}`);
    return null;
  }

  return privacyPolicyLink || null;
}

// Function to extract all email addresses matching the pattern *****@gmail.com
function extractEmailsFromHTML(html) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex);
  if (!matches) return []; // Return an empty array if no matches are found

  const filteredEmails = matches.filter(email => !email.includes('wixpress') && !email.includes('example') && !email.includes('sentry'));

  // Use a Set to remove duplicates and convert back to an array
  const uniqueEmails = [...new Set(filteredEmails)];
  return uniqueEmails;
}

