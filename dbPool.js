// database
const mysql = require('mysql');
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'r1bsyfx4gbowdsis.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'qc0w3lq0xdqs5ny3',
    password: 'ea3ex48nw4hd4v3q',
    database: 'sn1qvahom0zodcij',
    timezone: 'utc' //<-- here
});

module.exports = pool;