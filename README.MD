
## Description
SmartRoute Dehradun is a lightweight, responsive web application designed to help users find the shortest and most efficient paths within a specific part of Dehradun. Built using Dijkstra’s algorithm, the app calculates optimal routes based on the selected mode of travel: cycling, walking, or driving.

## Deployment Methods

#### 1. [Render](https://render.com/)
#### 2. [Vercel](https://vercel.com/)

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`VITE_TOMTOM_API_KEY`

`VITE_FIREBASE_API_KEY`
`VITE_FIREBASE_AUTH_DOMAIN`
`VITE_FIREBASE_PROJECT_ID`
`VITE_FIREBASE_STORAGE_BUCKET`
`VITE_FIREBASE_MESSAGING_SENDER_ID`
`VITE_FIREBASE_APP_ID`


## Deployment

To Install all this modules run
```bash
  npm install
```

To deploy this project run
```bash
  npm run dev
```

<b>Note:</b> Currently, the app supports only a limited region within Dehradun. 

- For adding more location use the OpenStreetMap data and convert it into the GeoJson and replace in the `public/data` folder 

## Features

- Shortest Route Finder
- Multiple Travel modes
- Live Traffic Updates
- Location Search
- Nearby Places
- Map Types
- Fully  Responsive

## Credits
- [Sameer singh bhandari](https://github.com/xtrimDev/)
