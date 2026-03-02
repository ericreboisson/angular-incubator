import { Component, signal, inject, OnInit } from '@angular/core';
import { ConfigService, HttpLoggerService } from 'config-merge';
import { environment } from '../environments/environment';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Angular Config App');
  protected readonly configService = inject(ConfigService<typeof environment>);
  protected readonly loggerService = inject(HttpLoggerService<typeof environment>);

  protected config = this.configService.getConfig();
  protected featureFlags = this.configService.getProperty('featureFlags');
  protected betaFeatureEnabled = this.featureFlags?.betaFeature ?? false;

  ngOnInit() {
    if (this.betaFeatureEnabled) {
      this.loggerService.info('App component initialized with beta features enabled!');
    }
  }
}
