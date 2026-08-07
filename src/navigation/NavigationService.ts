/**
 * NavigationService.ts
 *
 * A singleton navigation ref that allows imperative navigation from
 * outside the React component tree (e.g., from context, services).
 *
 * Usage:
 *   - Attach `navigationRef` to <NavigationContainer ref={navigationRef}>
 *   - Call `resetToChooseRole()` from anywhere to go to the ChooseRole screen
 */

import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Resets the navigation stack to the ChooseRole screen.
 * Used after logout or exiting professional mode.
 */
export const resetToChooseRole = (): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ChooseRole' }],
      }),
    );
  }
};
