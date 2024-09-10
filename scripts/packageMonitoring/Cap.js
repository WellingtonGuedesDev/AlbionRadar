const Cap = require('cap').Cap;
const decoders = require('cap').decoders;
const PhotonParser = require("./photon/PhotonPacketParser");

function setupPacketCapture() {
    return new Promise((resolve) => {
        const manager = new PhotonParser();
        const c = new Cap();
        const device = Cap.findDevice('192.168.54.204');
        const filter = "udp and (dst port 5056 or src port 5056)";
        const bufSize = 4096;
        const buffer = Buffer.alloc(4096);
        const linkType = c.open(device, filter, bufSize, buffer);

        c.setMinBytes && c.setMinBytes(0);

        c.on("packet", function (nbytes, trunc) {
            let ret = decoders.Ethernet(buffer);
            ret = decoders.IPV4(buffer, ret.offset);
            ret = decoders.UDP(buffer, ret.offset);

            let payload = buffer.subarray(ret.offset, nbytes);

            try {
                manager.handle(payload);
            } catch { }
        });

        manager.on("event", (data) => {
            resolve(data);
        });
    });
}

module.exports = setupPacketCapture;