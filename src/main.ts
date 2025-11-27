import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/interceptors/auth-interceptor';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes || []),
    // Register these provider modules so HttpClient + ngModel are available app-wide
     // helper: resolve userId from arg or auth
     provideHttpClient(), // optional but recommended
    // Register your auth interceptor here (no NgModule required)
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    // other providers...
    importProvidersFrom(
      HttpClientModule,
      FormsModule
    )
  ]
}).catch((err) => console.error(err));
