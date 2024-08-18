import { UnixAbsolutePath } from '.';
import VendorController from '../controllers/vendor.controller';
import { VendorSchema } from '../schemas/vendor.schema';
import { RouteFactory } from './route.interface';

class Vendor extends RouteFactory {
  collection = 'vendor';
  controller = VendorController;
  path = new UnixAbsolutePath('/vendor').getPath();
  schema = VendorSchema;
}

export { Vendor };
