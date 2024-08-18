import { EndPointsPath } from '../routes/endpoints.route';
import { ControllerFactory } from './controller.interface';
const listEndpoints = require('express-list-endpoints');
const debug = require('debug')('list-endpoints');

export const PathSubDirRegex =
  /(?:\/[a-zA-z0-9]{1,})?(\/)([a-zA-Z]{3,})(?:\/id)?$/g;

export function parseEndpoints(app: Express.Application) {
  return listEndpoints(app).reduce((ls, item) => {
    delete item.middlewares;
    if (item.path !== EndPointsPath)
      ls.push({
        ...item,
        resource: item.path.replace(PathSubDirRegex, '$2'),
        methods: item.methods.map((method) => {
          var name =
            item.path.slice(-3) === '/id'
              ? method.toLowerCase() + 'ByID'
              : method.toLowerCase();
          // HTTP Method Name + API Function Name
          return { http: method, name };
        }),
      });

    return ls;
  }, []);
}

class EndpointsFactory extends ControllerFactory {
  get = async (req, res) => {
    return parseEndpoints(this.app);
  };
}

export { EndpointsFactory };
