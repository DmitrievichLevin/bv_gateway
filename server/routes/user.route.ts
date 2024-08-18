import UserController from '../controllers/user.controller';
import { UserSchema } from '../schemas/user.schema';
import { RouteFactory } from './route.interface';

class User extends RouteFactory {
  controller = UserController;
  collection = 'user';
  schema = UserSchema;
}

export { User };
