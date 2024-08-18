import ContactController from '../controllers/contact.controller';
import { RouteFactory } from './route.interface';
import { ContactSchema } from '../schemas/contact.schema';

class Contact extends RouteFactory {
  collection = 'contact';
  controller = ContactController;
  schema = ContactSchema;
}

export { Contact };
