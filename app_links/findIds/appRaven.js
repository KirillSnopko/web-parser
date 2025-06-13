//Cобирает апки с внутренним айди платформы, потом нужно искать айди эпстора

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app_limit = 5000;
const ratings = 500;
let apps_count = 0;

// Define the GraphQL query and variables
const graphqlRequestTemplate = {
    operationName: "GetNewApps",
    variables: {
        miniFilter: {
            genreId: null,
            price: "ANY",
            ratingCount: ratings,
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
    const csvFilePath = path.join(__dirname, 'result', `appRaven_ids_new_release_r${ratings}_13.06.2025.csv`);
    const stream = fs.createWriteStream(csvFilePath);

    // Write CSV header
    stream.write('Link\n');

    let currentPage = 1;
    let shouldContinue = true;

    try {
        console.log("Starting to fetch data...");
        const uniqueLinks = new Set();

        while (shouldContinue && apps_count <= app_limit) {
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

            apps_count += contentArray.length;
            console.log(`Processing ${contentArray.length} apps on page ${currentPage}...`);

            // Flag to check if any timestamp is >= 2024-04-01
            let foundRecentActivity = false;

            for (const item of contentArray) {
                const appId = item.app?.id;
                const lastActivityTimestamp = item.app?.lastActivity?.timestamp;

                if (appId && lastActivityTimestamp) {

                    var appStoreId = await getAppStoreId(appId);

                    if (appStoreId != null) {
                        var link = `https://apps.apple.com/us/app/id${appStoreId}\n`;

                        if (!uniqueLinks.has(link)) {
                            uniqueLinks.add(link);
                            stream.write(link);
                        }
                    }

                    // Check if the lastActivity timestamp is >= 2024-01-01
                    const activityDate = new Date(lastActivityTimestamp);
                    const cutoffDate = new Date('2024-01-01');
                    if (activityDate >= cutoffDate) {
                        foundRecentActivity = true;
                    }
                }
            }

            // Determine if we should continue fetching more pages
            if (!foundRecentActivity || !hasNext) {
                console.log("No more recent activity found or no more pages available.");
                shouldContinue = false;
            } else {
                currentPage = nextPageNumber; // Move to the next page
            }
        }

        console.log(`COUNT=${apps_count}`);
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


async function getAppStoreId(appId) {
    try {
        const graphqlRequest = { ...graphqlRequestFindId };
        graphqlRequest.variables.id = appId;

        // Send the request to the GraphQL endpoint
        const response = await axios.post('https://appraven.net/appraven/graphql', graphqlRequest, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data?.data?.app?.ITunesId;

    } catch (error) {
        console.error("An error occurred:", error.message);
        return null;
    }
}

// Define the GraphQL query and variables
const graphqlRequestFindId = {
    operationName: "GetAppDetail",
    variables: {
        id: 0
    },
    query: `query GetAppDetail($id: ID!) {
  app(id: $id) {
    ...AppDetail
    __typename
  }
}

fragment AppDetail on App {
  id
  ITunesId
  title
  artworkUrl
  assets {
    ...AppAsset
    __typename
  }
  priceTier
  rating
  ratingCount
  preorder
  game
  arcade
  onStore
  hasInAppPurchases
  iapCount
  version
  lastUpdateDate
  subtitle
  releaseNotes
  description
  ratingInfo {
    topPosition
    __typename
  }
  collections(sort: {by: SCORE, direction: DESC}, pageSize: 9) {
    totalElements
    content {
      ...CollectionMiniThumbnail
      __typename
    }
    __typename
  }
  appTags(sort: {by: APP_COUNT, direction: DESC}, page: 0) {
    totalElements
    content {
      ...AppTagThumbnail
      __typename
    }
    __typename
  }
  comments(sort: {by: TIMESTAMP, direction: DESC}, maxDepth: 0, pageSize: 5) {
    totalElements
    content {
      ...CommentThumbnail
      __typename
    }
    __typename
  }
  similarApps(pageSize: 10) {
    content {
      ...AppThumbnail
      __typename
    }
    __typename
  }
  developer {
    id
    name
    apps(pageSize: 9) {
      content {
        ...AppThumbnail
        __typename
      }
      __typename
    }
    myWatch {
      ...WatchInteractionInfo
      __typename
    }
    __typename
  }
  lastActivity {
    ...AppActivity
    __typename
  }
  activityList {
    ...AppActivityDetail
    __typename
  }
  genres {
    ...AppGenre
    __typename
  }
  devices
  controller
  size
  ageRating
  releaseDate
  minimumOSVersion
  macOSCompatible
  gameCenter
  upvoteCount
  downvoteCount
  ownCount
  watchCount
  commentCount
  myVote {
    type
    __typename
  }
  myWatch {
    ...WatchInteractionInfo
    __typename
  }
  youOwn
  __typename
}

fragment AppAsset on AppAsset {
  id
  type
  url
  device
  __typename
}

fragment CollectionMiniThumbnail on Collection {
  id
  title
  topArtworks
  __typename
}

fragment AppTagThumbnail on AppTag {
  id
  title
  description
  appCount
  watchCount
  myWatch {
    ...WatchInteractionInfo
    __typename
  }
  __typename
}

fragment CommentThumbnail on Comment {
  id
  text
  timestamp
  user {
    id
    displayName
    iconSmall
    premium
    role
    __typename
  }
  premiumOnly
  entity {
    id
    __typename
  }
  parent {
    id
    user {
      id
      displayName
      __typename
    }
    __typename
  }
  upvoteCount
  downvoteCount
  myVote {
    type
    __typename
  }
  hasReplies
  replyCount
  commentCount
  deleted
  __typename
}

fragment AppThumbnail on App {
  id
  title
  artworkUrl
  priceTier
  rating
  ratingCount
  preorder
  game
  arcade
  onStore
  hasInAppPurchases
  ratingInfo {
    topPosition
    __typename
  }
  developer {
    name
    __typename
  }
  lastActivity {
    ...AppActivity
    __typename
  }
  genres {
    ...AppGenre
    __typename
  }
  devices
  upvoteCount
  downvoteCount
  commentCount
  myWatch {
    ...WatchInteractionInfo
    __typename
  }
  youOwn
  __typename
}

fragment WatchInteractionInfo on WatchInteraction {
  price
  inAppPurchases
  maxPriceTier
  rareOnly
  updates
  availability
  comments
  newAppAdded
  notificationLevel
  __typename
}

fragment AppActivity on AppActivity {
  timestamp
  ... on AppActivityAvailability {
    availabilityChangeType: type
    __typename
  }
  ... on AppActivityPriceChange {
    priceChangeType: type
    priceTierFrom
    __typename
  }
  ... on AppActivityUpdate {
    updateSize
    versionTo
    __typename
  }
  __typename
}

fragment AppActivityDetail on AppActivity {
  id
  timestamp
  ... on AppActivityAvailability {
    availabilityChangeType: type
    priceTier
    __typename
  }
  ... on AppActivityPriceChange {
    priceChangeType: type
    priceTierFrom
    priceTierTo
    __typename
  }
  ... on AppActivityUpdate {
    updateSize
    versionFrom
    versionTo
    __typename
  }
  __typename
}

fragment AppGenre on AppGenre {
  ITunesId
  title
  parentITunesId
  __typename
}`
};