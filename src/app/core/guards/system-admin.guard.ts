import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protects routes that require the SystemAdmin role. */
export const systemAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()?.roles.includes('SystemAdmin')) {
    return true;
  }

  return router.createUrlTree(['/']);
};
