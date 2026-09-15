const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(googleMapsApiKey
      ? {
          config: {
            ...config.android?.config,
            googleMaps: { apiKey: googleMapsApiKey },
          },
        }
      : {}),
  },
});
