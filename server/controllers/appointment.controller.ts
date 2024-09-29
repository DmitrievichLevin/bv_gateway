import { ControllerFactory } from './controller.interface';
import { v4 as uuidv4 } from 'uuid';
import { applyPatch } from 'fast-json-patch';
import { Model } from '../schemas/schemaTypes';
import { ServiceSchema } from '../schemas/service.schema';
import { Document, FilterQuery, HydratedDocument, model } from 'mongoose';
import dayjs from 'dayjs';
import { SettingsSchema } from '../schemas/settings.schema';
import { VendorSchema } from '../schemas/vendor.schema';
import { AppointmentSchema } from '../schemas/appointment.schema';
import { SavedDocument } from '../models/helpers/types';
const debug = require('debug')('appt-controller');

const buildAppointmentQuery = (
  date: string,
  startTime: number,
  duration: number
): FilterQuery<any> => {
  const END_OF_DAY_MIN = 1440;
  // Calc Start&End Date/Time From Service.duration
  const appt_start = dayjs(date).startOf('day').add(startTime, 'minutes');

  const appt_end = appt_start.clone();
  appt_end.add(duration, 'minutes');

  const endTime = startTime + duration;

  var query = [
    {
      date: appt_start.format('M/D/YYYY'),
      startTime: { $gte: startTime },
      endTime: { $lte: endTime <= END_OF_DAY_MIN ? endTime : END_OF_DAY_MIN },
    },
  ];

  if (endTime > 1440)
    query.push({
      date: appt_end.format('M/D/YYYY'),
      startTime: { $gte: 0 },
      endTime: { $lte: endTime - END_OF_DAY_MIN },
    });

  return { $or: query };
};

type AppointmentProps = {
  vendor: HydratedDocument<typeof VendorSchema>;
  settings: HydratedDocument<typeof SettingsSchema>;
  service: HydratedDocument<typeof ServiceSchema>;
  conflicts: HydratedDocument<typeof AppointmentSchema>[];
  date: string;
  time: number;
  duration: string;
  phone: string;
};

class AppointmentController extends ControllerFactory {
  /**
   * Booking Flow:
   * createDocumentnRows(req)
   * .onFail('Rollback Docs/Rows')
   * .onSuccess(Init Square Payment)
   * .onFail('Rollback Docs/Rows')
   * .onSuccess('redirect')
   */
  put = async (req, res) => {
    const { vendor, service: service_data, date, time, phone } = req.body;
    // Validate duration on service query
    const [service, duration] = service_data;
    console.log('track service data', service_data);
    var srv_model = model('services', ServiceSchema);
    var settings_modal = model('settings', SettingsSchema);
    var vendor_model = model('vendors', VendorSchema);

    await Promise.all([
      vendor_model.findById(vendor).orFail(),
      settings_modal.findOne({ vendorId: vendor }).orFail(),
      srv_model.findById(service).orFail(),
      this.model.find({
        ...buildAppointmentQuery(date, time, duration),
        vendorId: vendor,
      }),
    ])
      .then((results) => {
        const [vendor, settings, service, conflicts] = results;
        debug('vendor', vendor);
        debug('settings', settings);
        debug('service', service);
        debug('conflicts', conflicts);
        let appt;
        try {
          appt = this.Appointment({
            vendor,
            settings,
            service,
            conflicts,
            date,
            time,
            duration,
            phone,
          });
        } catch (e) {
          debug(e);
        }
        return appt.save();
      })
      .then((saved_appt) => {
        debug('checking saved appt', saved_appt.toObject());
      })
      .catch((err) => {
        throw err;
      });

    // Query Guest or Create Guest(findOneAndUpdate)
    // var guest_model = model('guest', GuestSchema);
    // var return_guest = await guest_model.findOne({ phone });
    // const { ...guest_things } = return_guest.toObject();

    // Query Date/Time Slot (if No-Overbooking)

    // Create Document
    // const defaultId = uuidv4();
    // const event = new this.model({
    //   date: appt_start.format('YYYY-MM-DD'),
    //   startTime: time,
    //   endDate: appt_end.format('YYYY-MM-DD'),
    //   endTime: time + duration,
    //   id: defaultId,
    // });
  };

  Appointment = (props: AppointmentProps) => {
    return new this.__appt_class(this, props);
  };

  __appt_class = class {
    constructor(
      parent,
      {
        vendor,
        settings,
        service,
        conflicts,
        date,
        time,
        duration: _duration,
        phone,
      }: AppointmentProps
    ) {
      const date_obj = dayjs(date).startOf('day').add(time);
      this.parent = parent;

      const duration = parseInt(_duration, 10);

      this.vendor = vendor;
      this.settings = settings;
      this.service = service;
      this.conflicts = conflicts;

      this.date = date_obj.format('YYYY-MM-DD');
      this.endDate = date_obj.add(duration, 'minutes').format('YYYY-MM-DD');

      this.startTime = time;
      this.endTime =
        time + duration <= 1440 ? time + duration : time + duration - 1440;

      this.duration = duration;
      this.phone = phone;

      this.__init();
    }

    __init = () => {
      const date_obj = dayjs(this.date).startOf('day').add(this.startTime);
      const date_obj_end = dayjs(this.date).startOf('day').add(this.endTime);

      // 1. Check Open Hours
      const businessDay = this.vendor.open[date_obj.day()];
      /**
       * Vendor is open
       * Appointment is after current moment
       */
      switch (true) {
        case !businessDay.active:
          this.error = `Vendor not open on ${date_obj.format(
            "dddd, MMMM D 'YY"
          )}`;
          break;
        case this.startTime < businessDay.start:
          this.error = `Vendor opens at ${date_obj.format(
            "h:mm a dddd, MMMM D 'YY"
          )}`;
          break;
        case this.startTime > businessDay.end:
          this.error = `Vendor closed at ${dayjs()
            .startOf('day')
            .add(businessDay.end)
            .format('h:mm a')}`;
          break;
        case date_obj.isBefore(dayjs()):
          this.error = 'Selected appointment in the past.';
          break;
        default:
      }

      // 2. Check Settings (overbooking)
      const {
        allow: { overbooking },
      } = this.settings;
      if (!overbooking && this.conflicts.length) {
        this.error = 'Appointment Date & Time not available.';
      }

      // 3. Verify Service Sent from client
      if (this.duration !== this.service.duration) {
        this.error = 'Invalid Service data sent from client.';
      }
    };

    save = (): Promise<SavedDocument> => {
      // Validate
      if (this.error) throw new Error(this.error);

      const defaultId = uuidv4();
      const appt = new this.parent.model({
        date: this.date,
        startTime: this.startTime,
        endDate: this.endDate,
        endTime: this.endTime,
        id: defaultId,
      });

      return appt.save();
    };

    parent: AppointmentController;
    vendor: HydratedDocument<typeof VendorSchema>;
    settings: HydratedDocument<typeof SettingsSchema>;
    service: HydratedDocument<typeof ServiceSchema>;
    conflicts: HydratedDocument<typeof AppointmentSchema>[];
    date: string;
    endDate: string;
    startTime: number;
    endTime: number;
    duration: number;
    phone: string;
    error: string;
  };

  get = async (req, _) => {
    const events = await this.model.find({});

    return events;
  };

  delete = async (req, _) => {
    const { id } = req.query;
    const removed = await this.model.findOneAndDelete({ id });

    if (removed) {
      return removed;
    } else {
      throw new Error('Unable to delete, Document not found.');
    }
  };

  middlewares = [];
}

export default AppointmentController;
