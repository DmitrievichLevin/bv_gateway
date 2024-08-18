import ServiceController from '../controllers/service.controller';
import { ServiceSchema } from '../schemas/service.schema';
import { RouteFactory } from './route.interface';

class Service extends RouteFactory {
  controller = ServiceController;
  collection = 'service';
  schema = ServiceSchema;
}

export { Service };
