"use strict";
const fs = require('fs');
const bencdoe = require('bencode');
const crypto = require('crypto');
const BN = require('bn.js');

function open(filepath){
    return bencdoe.decode(fs.readFileSync(filepath));
}

function size(torrent){
    const size = torrent.info.files ?
    torrent.info.files.map( (file) => file.length )
    .reduce( (a, b) => a+b  )
    : torrent.info.length;

    var number = new BN(size);
    return number.toBuffer('be', 8);
}

function infoHash(torrent){
    const info = bencdoe.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
}

module.exports = {
    open: open,
    size: size,
    infoHash: infoHash,
}