import SettingsController from '../controllers/settings.controller';
import { RouteFactory } from './route.interface';
import { SettingsSchema } from '../schemas/settings.schema';

class Settings extends RouteFactory {
  controller = SettingsController;
  collection = 'settings';
  schema = SettingsSchema;
}

export { Settings };
