import { MicroServiceFactory } from './microController.interface';

/**
 * Note: Must save Mongo Document Before Media Upload.
 */
class MediaController extends MicroServiceFactory {
  url = process.env.MEDIA_MICROSERVICE as string;
}

export { MediaController };
