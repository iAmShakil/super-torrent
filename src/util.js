const crypto = require('crypto');
var id = null;

function genId(){
    if(!id){
        var id = crypto.randomBytes(20);
        Buffer.from('-SK0001-').copy(id, 0);
        return id;
    }
}

module.exports = {
    genId : genId,
}