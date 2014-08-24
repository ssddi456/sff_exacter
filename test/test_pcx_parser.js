var transformer = require('../transformer');
var fs = require('fs');
var source = fs.readFileSync('./00000001.pcx');
var act_source = fs.readFileSync('./Sakuya_1P.act');

fs.writeFileSync( './Sakuya_1P.bmp', 
  transformer.pcx_to_bmp(source, act_source), 'binary' );
