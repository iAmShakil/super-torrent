"use strict";

const dgram = require('dgram');
const Buffer = require("buffer").Buffer;
const urlParse = require("url").parse;
const crypto = require('crypto');
const torrentParser = require('./torrent-parser');
const util = require('./util');

const getPeers = (theTorrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = theTorrent.announce.toString('utf8');
    console.log("before send" + url);
    udpSender(socket, buildConnectionReq(), url, function(err, res){
        if(err){
            console.log(`error occured! ${err}`);
        }
        if(res){
            console.log("first send success");
        }
    });
    console.log('after send');
    socket.on('message',function(msg){
        console.log('socket started');
        // checking what type of response it is
        if(respType(msg) === 'connect'){
            // parse the response
            console.log("connect logged");
            const connResp = parseConnResp(msg); 
            const announcReq = buildAnnounceReq(connResp.connectionId, theTorrent);
            udpSender(socket,announcReq,url);
        } else if (respType(msg) === 'announce'){
            // parse announce req
            console.log("announce logged");
            const announceResp = parseAnnounceResp(msg);
            // calling the callback of getPeers function to work with the announce resp. it is the list of a peers
            callback(announceResp);
        }
    });

    console.log('after socket');
}

function udpSender(socket,message,rawUrl,callback){
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function buildConnectionReq(){
    // allocating buffer size
    const buf = Buffer.alloc(16);

    // connection id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    // connection request 0
    buf.writeUInt32BE(0,8);
    // creating a random byte buffer and copying it to the main buf
    crypto.randomBytes(4).copy(buf, 12);

    return buf;

}
function respType(response){
    const action = response.readUInt32BE(0);
    if(action === 0) { return "connect";}
    if(action === 1) { return "announce";}
}

function parseConnResp(response){
    return {
        action : response.readUInt32BE(0),
        transactionId: response.readUInt32BE(4),
        connectionId: response.slice(8),
    }
}

function buildAnnounceReq(connId, torrent, port=6881){

    // building an announce req based on the info from conn req.
    // for details on how to buld announce reqs, check the specific protocol's site

    const buf = Buffer.allocUnsafe(98);

    // putting connection id
    connId.copy(buf,0);

    // putting action
    buf.writeUInt32BE(1,8);

    // putting transaction id into the buffer
    crypto.randomBytes(4).copy(buf,12);

    // info hash
    torrentParser.infoHash(torrent).copy(buf,16);

    // putting a generated peer id. (generated from a separate file)
    util.genId().copy(buf,36);

    // downloaded
    Buffer.alloc(8).copy(buf,56);

    // putting torrent size
    torrentParser.size(torrent).copy(buf, 64);

    // uploaded
    Buffer.alloc(8).copy(buf, 72);

    // event
    buf.writeUInt32BE(0, 80);

    // ip address
    buf.writeUInt32BE(0, 84);

    // generating random bytes and using as key
    crypto.randomBytes(4).copy(buf, 88);

    // num want
    buf.writeInt32BE(-1, 92);
    // port
    buf.writeUInt16BE(port, 96);

    return buf;

}

function parseAnnounceResp(response){
    function group(iteralable, groupSize){
        let groups = [];
        for(let i = 0; i < iteralable.length; i += groupSize){
            groups.push(iteralable.slice(i, i+groupSize));
        }

        return groups;
    }
    return {
        action: response.readUInt32BE(0),
        transaction_id: response.readUInt32BE(4),
        leechers: response.readUInt32BE(8),
        seeders: response.readUInt32BE(12),
        peers: group(response.slice(20), 6).map( (address) => {
            return {
                ip: address.slice(0,4).join('.'),
                port: address.readUInt16BE(4),
            };
        } ),
    };
}

module.exports = getPeers;