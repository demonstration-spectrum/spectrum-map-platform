import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// An auth guard that tries to authenticate if a JWT is present, but never blocks the request.
// If the token is valid, req.user will be populated; if missing/invalid, the request continues unauthenticated.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'] || request.headers['Authorization'];

    // If there's no Authorization header, allow the request without invoking the JWT strategy
    if (!authHeader) {
      return true;
    }

    try {
      const result = super.canActivate(context) as any;
      // Handle async return
      if (result && typeof result.then === 'function') {
        return result.catch(() => true);
      }
      return result;
    } catch (_) {
      // Swallow errors and proceed as unauthenticated
      return true;
    }
  }

  // Never throw on auth errors; just return user or null
  handleRequest(err: any, user: any /* info, context, status */) {
    if (err) {
      return null;
    }
    return user || null;
  }
}
