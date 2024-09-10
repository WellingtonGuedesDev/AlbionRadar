const express = require("express");
const webSocket = require("ws");
const Cap = require('cap').Cap;
const decoders = require('cap').decoders;
const PhotonParser = require("./scripts/packageMonitoring/photon/PhotonPacketParser");
const Player = require("./scripts/handles/player");

const app = express();


app.get("/", (req, res) => {
    res.send("Hello World");
})


const manager = new PhotonParser();
const c = new Cap();
const device = Cap.findDevice('192.168.54.204');
const filter = "udp and (dst port 5056 or src port 5056)";
var bufSize = 4096;
var buffer = Buffer.alloc(4096);
//const manager = new PhotonParser();
var linkType = c.open(device, filter, bufSize, buffer);

c.setMinBytes && c.setMinBytes(0);

// setup Cap event listener on global level
c.on("packet", function (nbytes, trunc) {
    let ret = decoders.Ethernet(buffer);
    ret = decoders.IPV4(buffer, ret.offset);
    ret = decoders.UDP(buffer, ret.offset);

    let payload = buffer.subarray(ret.offset, nbytes);

    // Parse the UDP payload
    try {
        manager.handle(payload);
    } catch { }
});

manager.on("event", (data) => {
    if (data.parameters[252] === 29) {
        const player = new Player(data.parameters[0], data.parameters[1], data.parameters[22], data.parameters[23], data.parameters[40]);
        console.log(player);
    }
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})