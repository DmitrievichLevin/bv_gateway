import { RouteFactory } from './route.interface';
import { AppointmentSchema } from '../schemas/appointment.schema';
import AppointmentController from '../controllers/appointment.controller';

class Appointment extends RouteFactory {
  collection = 'event';
  controller = AppointmentController;
  schema = AppointmentSchema;
}

export { Appointment };
