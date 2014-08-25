var fs = require('fs');
var path = require('path');

var transformer = require('../transformer');

var source = fs.readFileSync('./00000001.pcx');
var sff    = fs.readFileSync('./sakuya.sff');
var act_source = fs.readFileSync('./Sakuya_1P.act');

fs.writeFileSync( './Sakuya_1P.bmp', 
  transformer.pcx_to_bmp(source, act_source), 'binary' );
var root = './spirits';
var map = transformer.sff_to_bmp_with_json( sff, act_source );
map.spirits.forEach(function( spirit ) {
  fs.writeFile ( path.join( root, spirit.name + '.bmp'), spirit.bmp );
});
fs.writeFile( path.join(root,'map.json'), JSON.stringify(map.spirits_info) );

var state_map = {
  '0' : 'stand',
  '1' : 
}
var css = map.spirits_info.keys().map(function( k ) {
    
}).join('');