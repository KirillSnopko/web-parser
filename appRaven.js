const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define the GraphQL query and variables
const graphqlRequestTemplate = {
    operationName: "GetNewApps",
    variables: {
        miniFilter: {
            genreId: null,
            price: "ANY",
            ratingCount: 0,
            device: null
        },
        page: 1 // Start with page 1
    },
    query: `query GetNewApps($miniFilter: MiniFilterInput!, $page: Int!) {
        newApps(miniFilter: $miniFilter, page: $page) {
            content {
                id
                app {
                    id
                    title
                    lastActivity {
                        timestamp
                        __typename
                    }
                    __typename
                }
                __typename
            }
            hasNext
            nextPageable {
                pageNumber
                __typename
            }
            __typename
        }
    }`
};

// Function to send the GraphQL request and process the response
async function fetchAppIdsUntilDate() {
    const csvFilePath = path.join(__dirname, 'app_ids.csv');
    const stream = fs.createWriteStream(csvFilePath);

    // Write CSV header
    stream.write('Links');

    let currentPage = 1;
    let shouldContinue = true;

    try {
        console.log("Starting to fetch data...");
        const uniqueLinks = new Set();

        while (shouldContinue) {
            console.log(`Fetching page ${currentPage}...`);

            // Update the GraphQL request with the current page number
            const graphqlRequest = { ...graphqlRequestTemplate };
            graphqlRequest.variables.page = currentPage;

            // Send the request to the GraphQL endpoint
            const response = await axios.post('https://appraven.net/appraven/graphql', graphqlRequest, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Extract the content array from the response
            const contentArray = response.data?.data?.newApps?.content;
            const hasNext = response.data?.data?.newApps?.hasNext;
            const nextPageNumber = response.data?.data?.newApps?.nextPageable?.pageNumber;

            if (!contentArray || contentArray.length === 0) {
                console.log("No more data found.");
                break;
            }

            console.log(`Processing ${contentArray.length} apps on page ${currentPage}...`);

            // Flag to check if any timestamp is >= 2024-04-01
            let foundRecentActivity = false;

            // Process each app in the content array
            contentArray.forEach(item => {
                const appId = item.app?.id;
                const lastActivityTimestamp = item.app?.lastActivity?.timestamp;

                if (appId && lastActivityTimestamp) {
                    var link = `https://apps.apple.com/us/app/id${appId}\n`;

                    if(!uniqueLinks.has(link)){
                        uniqueLinks.add(link);
                        stream.write(link);
                    }

                    // Check if the lastActivity timestamp is >= 2024-04-01
                    const activityDate = new Date(lastActivityTimestamp);
                    const cutoffDate = new Date('2024-04-01');
                    if (activityDate >= cutoffDate) {
                        foundRecentActivity = true;
                    }
                }
            });

            // Determine if we should continue fetching more pages
            if (!foundRecentActivity || !hasNext) {
                console.log("No more recent activity found or no more pages available.");
                shouldContinue = false;
            } else {
                currentPage = nextPageNumber; // Move to the next page
            }
        }

        console.log(`Data fetching complete. App IDs saved to ${csvFilePath}`);
    } catch (error) {
        console.error("Error fetching data:", error.message);
    } finally {
        // Close the CSV file stream
        stream.end();
    }
}

// Run the script
fetchAppIdsUntilDate();