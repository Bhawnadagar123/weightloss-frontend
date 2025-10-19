import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes || []),
    // Register these provider modules so HttpClient + ngModel are available app-wide
    importProvidersFrom(
      HttpClientModule,
      FormsModule
    )
  ]
}).catch((err) => console.error(err));
