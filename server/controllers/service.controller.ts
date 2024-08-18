import sessionAuth from '../connections/firebase/middlewares/sessionAuth';
import { ControllerFactory } from './controller.interface';
import { MediaDocument } from '../models/MediaModel/find/findMediaDoc';
import { MultiMediaModel } from '../models/MediaModel/save/saveMediaDoc';
const debug = require('debug')('service-controller');

class ServiceController extends ControllerFactory {
  post = async (req, res) => {
    const document = new MultiMediaModel(req, res, this.model);

    const service = await document.save();
    debug('check multi save return', service);
    return service;
  };

  get = async (req, res) => {
    const { id } = req.query;
    const model = new MediaDocument(req, res, this.model);
    const services = await model.find({ parent: id });
    debug('Tracking service Find', services);
    return null;
  };

  middlewares = [sessionAuth];
}

export default ServiceController;
