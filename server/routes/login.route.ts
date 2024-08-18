import { UnixAbsolutePath } from '.';
import LoginController from '../controllers/login.controller';
import { UserSchema } from '../schemas/user.schema';
import { RouteFactory } from './route.interface';

class Login extends RouteFactory {
  collection = 'user';
  controller = LoginController;
  schema = UserSchema;
  path = new UnixAbsolutePath('/login').getPath();
}

export { Login };
