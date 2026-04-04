import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';

// Export them individually if you still need them elsewhere
export { appConfig, databaseConfig, jwtConfig };

// Export the bundled array for the AppModule
export const configLoaders = [
  appConfig,
  databaseConfig,
  jwtConfig,
];
