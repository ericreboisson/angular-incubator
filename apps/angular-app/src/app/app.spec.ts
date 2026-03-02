import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ConfigService, HttpLoggerService } from 'config-merge';

describe('App', () => {
  let logCalled = false;

  beforeEach(async () => {
    logCalled = false;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getConfig: () => ({ apiEndpoint: 'http://test', featureFlags: { betaFeature: true } })
          }
        },
        {
          provide: HttpLoggerService,
          useValue: { info: () => { logCalled = true; } }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should call logger info if beta feature is enabled', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges(); // triggers ngOnInit
    expect(logCalled).toBe(true);
  });
});
