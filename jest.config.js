module.exports = {
  preset: 'jest-expo',
  // Evita che jest carichi l'implementazione nativa di reanimated/worklets
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: ['./jest.setup.js'],
};
