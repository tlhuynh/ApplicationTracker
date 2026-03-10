import {
  ApplicationConfig,
  APP_INITIALIZER,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    /**
     * withComponentInputBinding allows route params and query params to be
     * bound directly as component inputs — cleaner than injecting ActivatedRoute.
     */
    provideRouter(routes, withComponentInputBinding()),

    /** Required for Angular Material components that use animations. */
    provideAnimationsAsync(),

    /**
     * Registers HttpClient with the auth interceptor.
     * The interceptor runs on every outgoing HttpClient request in the app.
     */
    provideHttpClient(withInterceptors([authInterceptor])),

    /**
     * APP_INITIALIZER runs before the app renders any routes.
     * tryRestoreSession() checks localStorage for a refresh token and silently
     * restores the session — ensures auth state is accurate before guards run.
     *
     * multi: true allows multiple APP_INITIALIZER tokens to coexist.
     * useFactory with inject() is the modern alternative to the older deps array.
     */
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authService = inject(AuthService);
        return () => authService.tryRestoreSession();
      },
      multi: true,
    },
  ],
};
