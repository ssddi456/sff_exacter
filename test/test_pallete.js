var parser = require('../parser');
var fs = require('fs');

console.log( parser.act_parser(fs.readFileSync('./Sakuya_1P.act')));