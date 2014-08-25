var fs = require('fs');
var parser = require('../parser');
var air;
console.log(
  air = parser.air_parser(fs.readFileSync('./sakuya.air','utf-8')));

fs.writeFileSync('./spirits/air.json', JSON.stringify(air));