const fs = require('fs');
const bencode = require('bencode');
const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser');
const download = require('./src/download');

const decoded = torrentParser.open('despacito.torrent');

// returns a list of peers to the callback
download(decoded);