module.exports = {
  root: true,
  extends: 'expo',
  ignorePatterns: ['/android', '/ios', '/.expo', '/node_modules'],
  rules: {
    // Regole del React Compiler che segnalano pattern del codice esistente
    // (funzioni usate negli effect prima della dichiarazione, useRef().current).
    // Non sono bug a runtime: restano come avvisi finché non si rifattorizzano le schermate.
    'react-hooks/immutability': 'warn',
    'react-hooks/refs': 'warn',
  },
  overrides: [
    {
      files: ['jest.setup.js', '__tests__/**'],
      env: { jest: true },
    },
  ],
};
