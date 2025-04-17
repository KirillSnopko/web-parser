const fs = require('fs');

// Path to your JSON file
const filePath = 'appRaven_output.json'; // Replace with your actual file path
process(filePath);


// Main function to process the JSON file
function process(filePath) {
        // Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf8');
        var apps = JSON.parse(rawData);

        apps = apps.filter(x => x.Email != null);

        var count = apps.length;

        // Save the updated JSON file
        fs.writeFileSync(`email_${count}_${filePath}`, JSON.stringify(apps, null, 2), 'utf8');
        console.log(`JSON file saved successfully.[${count}]`);
}