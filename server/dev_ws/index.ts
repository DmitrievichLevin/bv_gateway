const { WebSocketServer } = require('ws');
const deb = require('debug')('ws-test');

const wss = new WebSocketServer({ port: 9021 });
deb('started wss');
const clients = {};

wss.on('connection', function connection(ws, req) {
  ws.on('error', (err) => deb(err));
  var id = req.url.replace('/?id=', '');
  ws.id = id;

  if (id !== 'server') {
    clients[id] = ws;
    deb('adding client', Object.keys(clients));
  }

  ws.on('message', function message(data) {
    deb('track unknown message', data.toString(), ws.id);
    if (ws.id !== 'server') {
      deb('Discarded client message.');
    } else {
      const [key, from] = data.toString().split(':');
      deb('check message', key, from);
      Object.values(clients).forEach((client: any) =>
        client.send(JSON.stringify({ key, from }))
      );
    }
  });
});
