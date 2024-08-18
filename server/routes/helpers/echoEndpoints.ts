import { director } from '../../app';
import { parseEndpoints } from '../../controllers/controller.endpoints';
const shell = require('shelljs');

const interfacePropertyDef = ({ resource }: { resource: string }) => {
  var rName = resource[0].toUpperCase() + resource.slice(1) + 'API';
  return `'${rName}',\n`;
};

const endPointObjDef = ({ path, methods, resource }) => {
  return `{ path: '${path}', methods: [${methods
    .map((met) => `{name: '${met.name}', http: '${met.http}'}`)
    .join(',')}], resource: '${resource}'},`;
};

director.build().then((app) => {
  const endpoints = parseEndpoints(app);

  const exportsDefStart = '\nconst Exports = [\n';
  const endpointsDefStart = `\nconst Endpoints = [ \n`;

  let body = endpoints.reduce(
    (defs: { list: string; exports: string }, item, idx) => {
      defs.list += endPointObjDef(item);
      if (!defs.exports.toLowerCase().includes(item.resource))
        defs.exports += interfacePropertyDef(item);
      if (idx === endpoints.length - 1) {
        defs.list += '];\n';
        defs.exports += ']\n';
      }
      return defs;
    },
    { list: endpointsDefStart, exports: exportsDefStart }
  );

  console.log(`exports="${body.exports}" endpoints="${body.list}"`);
});
