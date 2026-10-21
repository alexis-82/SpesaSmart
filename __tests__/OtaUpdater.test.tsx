import React from 'react';
import { Alert } from 'react-native';
import { render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Updates from 'expo-updates';
import OtaUpdater from '../OtaUpdater';

jest.mock('expo-updates', () => ({
  isEnabled: false,
  useUpdates: jest.fn(),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

const mockUseUpdates = Updates.useUpdates as jest.Mock;

describe('OtaUpdater', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('non mostra nulla se non ci sono aggiornamenti scaricati', async () => {
    mockUseUpdates.mockReturnValue({ isUpdatePending: false });
    await render(<OtaUpdater />);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('chiede di riavviare quando un aggiornamento è pronto, una sola volta', async () => {
    mockUseUpdates.mockReturnValue({ isUpdatePending: true, downloadedUpdate: { updateId: 'abc' } });
    const { rerender } = await render(<OtaUpdater />);
    await rerender(<OtaUpdater />);

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    expect(buttons.map(b => b.text)).toEqual(['Più tardi', 'Riavvia ora']);

    buttons[1].onPress?.();
    expect(Updates.reloadAsync).toHaveBeenCalled();
  });

  it('con gli aggiornamenti disattivati non contatta il server', async () => {
    mockUseUpdates.mockReturnValue({ isUpdatePending: false });
    await render(<OtaUpdater />);
    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });
});
