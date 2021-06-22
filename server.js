require('./config.js')
const net = require('net');
const server_port = config.port;


const fs = require('fs');

const packet = require('./internal/packet.js'); // { build(), parse() }
const Client = require('./internal/entities/client.js'); // class Client {...}
const { delayReceive } = require('./internal/artificial_delay.js');

// load some init scripts (to not put everything in this file)
const init_files = fs.readdirSync(__dirname + '/internal/initializers', 'utf8');
init_files.forEach(function(file) {
    require(__dirname + '/internal/initializers/' + file);
})
console.log('loaded initializers!');

const express = require("express");
const { Console } = require('console');
const { stringify } = require('querystring');
const app = express();

app.get('/', (request, response) => {
     response.send("This is a server API and isn't supported in a browser!");
});

const port = process.env.port || 8081;
app.listen(port, () => {
     console.log("App server started on port: " + port);
});

// The Actual Server
const server = net.createServer(function(socket) {
    console.log("Socket connected!");
    
    var c = new Client(socket);
    global.clients.push(c); // add the client to clients list (unnecessary)

    // Bind functions on events

    socket.on('error', function(err) {
        if (err.message.includes('ECONNRESET')) { // this is a disconnect
            console.log('Socket violently disconnected.');
            // handle disconnect here
        }

        console.log(`Error! ${err}`);
    });
    
    // When data arrived
    socket.on('data', function(data) {
        // create artificial_delay
        if (delayReceive.enabled) {
            setTimeout(function() {
                packet.parse(c, data); // handle the logic
            }, delayReceive.get());
        }
        else { // just parse normally
            packet.parse(c, data); // handle the logic
        }
    });

    // When a socket/connection closed
    socket.on('close', function() {
        c.onDisconnect();
        console.log('Socket closed.');
    })
});

server.listen(server_port);
console.log("Server running on port " + server_port + "!");