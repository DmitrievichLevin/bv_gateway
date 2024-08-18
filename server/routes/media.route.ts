import { MediaController } from '../controllers/media.controller';
import { RouteFactory } from './route.interface';

class Media extends RouteFactory {
  controller = MediaController;
  collection = 'media';
}

export { Media };
