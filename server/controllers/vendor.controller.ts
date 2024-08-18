import { ControllerFactory } from './controller.interface';

import { MediaDocument } from '../models/MediaModel/find/findMediaDoc';

const debug = require('debug')('vendor-controller');

class VendorController extends ControllerFactory {
  get = async (req, res) => {
    const { id } = req.query;
    const vendor = new MediaDocument(req, res, this.model);
    const found = await vendor.findById(id);
    return found;
  };
}

export default VendorController;
