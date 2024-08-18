import { ControllerFactory } from './controller.interface';
import { v4 as uuidv4 } from 'uuid';
import { applyPatch } from 'fast-json-patch';

class AppointmentController extends ControllerFactory {
  patch = async (req, _) => {
    const { id, patch } = req.body;

    const patched = await this.model.findOne({ id }).then((doc) => {
      if (doc) {
        applyPatch(doc, patch).newDocument;
        doc.save();
        return doc;
      } else {
        throw new Error(`Document to be patched, not found id: ${id}`);
      }
    });

    return patched;
  };

  put = async (req, res) => {
    const { title, description, date } = req.body;

    const defaultId = uuidv4();

    // Random time (week calendar)
    let start = Math.floor(Math.random() * 1440);
    const startTime = start > 60 ? start - 60 : start;
    const endTime = startTime + 60;

    const event = new this.model({
      title,
      description,
      date,
      startTime,
      endDate: date,
      endTime,
      id: defaultId,
    });

    const data = await event.save();

    return data;
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
