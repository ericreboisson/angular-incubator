import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer } from '@angular/core';
import { ConfigService, HttpLoggerService } from 'config-merge';
import { environment } from '../environments/environment';

export const configService = new ConfigService(environment);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ConfigService,
      useValue: configService
    },
    {
      provide: HttpLoggerService,
      useFactory: () => new HttpLoggerService(configService),
    },
    provideAppInitializer(() => configService.loadAndMerge('/remote-config.json'))
  ]
};
