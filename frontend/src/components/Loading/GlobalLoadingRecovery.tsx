import { QueryTimeoutMonitor } from './QueryTimeoutMonitor';
import { NetworkRecovery } from './NetworkRecovery';

/**
 * Global Loading Recovery Component
 * 
 * Combines all global loading recovery mechanisms:
 * - Query timeout monitoring
 * - Network status recovery
 * 
 * Should be mounted at the app root level.
 */
export const GlobalLoadingRecovery = () => {
  return (
    <>
      <QueryTimeoutMonitor />
      <NetworkRecovery />
    </>
  );
};
