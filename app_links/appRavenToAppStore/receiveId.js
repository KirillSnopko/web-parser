const fs = require('fs');
const axios = require('axios');

const url = 'https://appraven.net/app/';
const file2Path = 'appRaven.csv'; // Path to the release file
const resultPath = 'appRavenToAppStore.csv';

processCSV(file2Path).catch(error => {
    console.error('Произошла ошибка:', error);
});

async function processCSV(filePath) {
    // Чтение CSV файла
    const csvData = fs.readFileSync(filePath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    // Массив для хранения результатов
    const results = [];
    var count = lines.length;

    const stream = fs.createWriteStream(resultPath);
    // Write CSV header
    stream.write('Link');
    const uniqueLinks = new Set();
    try {
        for (const line of lines) {

            console.log(`==========> осталось обработать ${count} ссылок`);
            count--;

            const link = line.trim();
            const appId = extractAppId(link);

            if (!appId) {
                console.error(`Не удалось извлечь ID из ссылки: ${link}`);
                continue;
            }

            try {
                const appstoreId = await getAppStoreId(appId);

                if (appstoreId == null) {
                    continue;
                }

                var applink = `https://apps.apple.com/us/app/id${appstoreId}\n`;

                if (!uniqueLinks.has(applink)) {
                    uniqueLinks.add(applink);
                    stream.write(applink);
                }



            } catch (error) {
                console.error(`Ошибка при обработке приложения с ID: ${appId}`, error.message);
            }
        }
    } finally {
        // Close the CSV file stream
        stream.end();
    }
}


async function getAppStoreId(appId) {
    try {
        const graphqlRequest = { ...graphqlRequestTemplate };
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

function extractAppId(url) {
    const match = url.match(/id(\d+)/);
    return match ? match[1] : null;
}

// Define the GraphQL query and variables
const graphqlRequestTemplate = {
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