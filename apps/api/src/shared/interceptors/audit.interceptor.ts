/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AuditLogsService } from '../../modules/audit/infrastructure/audit-logs.service';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ActionType, LogType } from '../../modules/audit/enums/audit-logs.enum';
import { Request } from 'express';
import { AuthUserObject } from '../../../globals';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  // Skip audit logging for these paths
  private readonly skipPaths = ['/health', '/metrics', '/favicon.ico'];

  constructor(private readonly auditService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const body = request.body;

    // Skip logging for certain paths and methods
    if (this.shouldSkipLogging(url)) {
      return next.handle();
    }

    // Capture timestamp
    const timestamp = new Date();
    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        // Only log if user is authenticated
        if (!user.userId) {
          return;
        }

        // Fire and forget - don't await
        void this.logSuccess(
          user,
          method,
          url,
          response,
          timestamp,
          Date.now() - startTime,
          body,
          request,
        ).catch((error: unknown) => {
          console.error('Audit logging failed:', error);
        });
      }),
      catchError((error: unknown) => {
        // Log the error operation
        if (user?.userId) {
          void this.logError(
            user,
            method,
            url,
            error,
            timestamp,
            Date.now() - startTime,
            body,
            request,
          ).catch((auditError: unknown) => {
            console.error('Audit error logging failed:', auditError);
          });
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * Log successful operations
   */
  private async logSuccess(
    user: AuthUserObject,
    method: string,
    url: string,
    response: any,
    timestamp: Date,
    duration: number,
    body: any,
    request: Request,
  ): Promise<void> {
    try {
      const action = this.mapMethodToAction(method);
      const resource = this.extractResource(url);
      const resourceId = this.extractResourceId(url, response);

      await this.auditService.createLog({
        userId: user.userId!,
        orgId: user.orgId || '',
        action,
        logType: LogType.SUCCESS,
        resource,
        resourceId,
        oldValues: undefined,
        newValues: this.sanitizeData(response) as Record<string, any>,
        metadata: {
          ip: this.getClientIp(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          method,
          url,
          statusCode: 200,
          duration,
          requestBody: this.sanitizeData(body),
        },
        createdAt: timestamp,
      });
    } catch (error) {
      console.error('Failed to log success to audit:', error);
    }
  }

  /**
   * Log failed operations
   */
  private async logError(
    user: AuthUserObject,
    method: string,
    url: string,
    error: unknown,
    timestamp: Date,
    duration: number,
    body: any,
    request: Request,
  ): Promise<void> {
    try {
      const action = this.mapMethodToAction(method);
      const resource = this.extractResource(url);
      const err = error as Error & {
        status?: number;
        stack?: string;
        originalError?: Error;
        errorType?: string;
      };

      await this.auditService.createLog({
        userId: user.userId!,
        orgId: user.orgId || '',
        action,
        logType: LogType.ERROR,
        resource,
        resourceId: undefined,
        oldValues: undefined,
        newValues: undefined,
        metadata: {
          ip: this.getClientIp(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          method,
          url,
          statusCode: err.status || 500,
          duration,
          requestBody: this.sanitizeData(body),
          error: {
            message: err.message || 'Unknown error',
            name: err.name || 'Error',
            stack: err.stack?.split('\n').slice(0, 3).join('\n') || '',
            // Preserve original error info if transformed by decorator
            originalErrorType: err.errorType || err.name,
            originalErrorMessage: err.originalError?.message,
          },
          success: false,
        },
        createdAt: timestamp,
      });
    } catch (auditError) {
      console.error('Failed to log error to audit:', auditError);
    }
  }

  /**
   * Map HTTP method to audit action type
   */
  private mapMethodToAction(method: string): ActionType {
    const methodMap: Record<string, ActionType> = {
      POST: ActionType.CREATE,
      PUT: ActionType.UPDATE,
      PATCH: ActionType.UPDATE,
      DELETE: ActionType.DELETE,
      GET: ActionType.READ,
    };

    return methodMap[method.toUpperCase()] || ActionType.READ;
  }

  /**
   * Extract resource name from URL
   * Example: /api/v1/products/123 -> products
   */
  private extractResource(url: string): string {
    const parts = url
      .split('/')
      .filter((p) => p && p !== 'api' && !p.match(/^v\d+$/));
    return parts[0] || 'unknown';
  }

  /**
   * Extract resource ID from URL or response
   */
  private extractResourceId(url: string, response: any): string | undefined {
    // Try to get from URL first (e.g., /products/123)
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = url.match(uuidRegex);
    if (match) {
      return match[0];
    }

    // Try to get from response
    if (response && typeof response === 'object') {
      if (response.id) return String(response.id);
      if (Array.isArray(response) && response[0]?.id)
        return String(response[0].id);
    }

    return undefined;
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]?.trim()
          : undefined;

    return (
      forwardedIp ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'creditCard',
      'ssn',
      'cvv',
    ];

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(
          obj as Record<string, unknown>,
        )) {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some((field) => lowerKey.includes(field))) {
            sanitized[key] = '***REDACTED***';
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitize(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }

      return obj;
    };

    return sanitize(data);
  }

  /**
   * Check if logging should be skipped for this request
   */
  private shouldSkipLogging(url: string): boolean {
    // Skip specific paths
    if (this.skipPaths.some((path) => url.includes(path))) {
      return true;
    }

    // Skip certain HTTP methods (optional - can be configured)
    // Uncomment if you don't want to log GET requests
    // if (this.skipMethods.includes(method.toUpperCase())) {
    //   return true;
    // }

    return false;
  }
}
