// createParamDecorator helps us create custom parameter decorator.
// ExecutionContext gives access to current HTTP request.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// CurrentUser decorator gives logged-in user data in controller.
// Example:
// @CurrentUser() user
export const CurrentUser = createParamDecorator(
  // _data is not used here.
  // context gives access to request.
  (_data: unknown, context: ExecutionContext) => {
    // Get HTTP request object.
    const request = context.switchToHttp().getRequest();

    // request.user is added by JwtStrategy validate() method.
    return request.user;
  },
);