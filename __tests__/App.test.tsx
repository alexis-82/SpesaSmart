import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { expect, it } from '@jest/globals';
import App from '../App';

it('renders correctly', async () => {
  await render(<App />);
  expect(await screen.findByText('La mia Lista della Spesa')).toBeTruthy();
});
