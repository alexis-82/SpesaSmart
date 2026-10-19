import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// I font delle icone non sono caricabili in jest: basta un segnaposto
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { Ionicons: ({ name }) => <Text>{name}</Text> };
});

// UpdateChecker fa una fetch all'avvio: nei test non deve uscire in rete
global.fetch = jest.fn(() => Promise.reject(new Error('network disabled in tests')));
