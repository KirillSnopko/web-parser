const fs = require('fs');
const csv = require('csv-parser');

// Paths to the input CSV files and the output release file
const file1Path = 'app_links/app_ids.csv'; // Path to the first CSV file
const file2Path = 'app_links/clean_app_ids.csv'; // Path to the second CSV file
const releaseFilePath = 'app_links/appRaven.csv'; // Path to the release file

// Call the main function
processFilesAndWriteUniqueLinks(file1Path, file2Path, releaseFilePath);


// Function to read and extract links from a CSV file
function extractLinksFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const links = [];
    console.log(`Reading file: ${filePath}`); // Log the file path

    fs.createReadStream(filePath)
      .pipe(csv()) // Parse the CSV file
      .on('data', (row) => {
        //console.log(row);
        // Assuming the column containing links is named 'link'
        if (row.Link) {
          links.push(row.Link.trim()); // Trim whitespace and add to the list
        }
      })
      .on('end', () => {
        console.log(`Finished reading file: ${filePath}`); // Log completion
        resolve(links); // Resolve with the extracted links
      })
      .on('error', (err) => {
        console.error(`Error reading file ${filePath}:`, err); // Log errors
        reject(err); // Reject if there's an error
      });
  });
}

// Main function to process the files and write unique links
async function processFilesAndWriteUniqueLinks(file1Path, file2Path, releaseFilePath) {
  try {
    // Step 1: Extract links from both files
    const linksFromFile1 = await extractLinksFromCSV(file1Path);
    const linksFromFile2 = await extractLinksFromCSV(file2Path);

    const uniqueLinks = linksFromFile1.filter(link => !linksFromFile2.includes(link));

    // Step 2: Combine the links and remove duplicates using a Set
    //const uniqueLinks = [...new Set([...linksFromFile1, ...linksFromFile2])];

    // Step 3: Write the unique links to the release file
    const releaseFileContent = uniqueLinks.join('\n'); // Join links with newlines
    fs.writeFileSync(releaseFilePath, releaseFileContent);

    console.log(`Unique links have been written to ${releaseFilePath}`);
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

