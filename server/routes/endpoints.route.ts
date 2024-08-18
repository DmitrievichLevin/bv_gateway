import { EndpointsFactory } from '../controllers/controller.endpoints';
import { RouteFactory } from './route.interface';

export const EndPointsPath = '/v1/endpoints';

class Endpoints extends RouteFactory {
  controller = EndpointsFactory;
  path = EndPointsPath;
}

export { Endpoints };
