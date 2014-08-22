var parser = require('../parser');
var fs = require('fs');
var util = require('util');

var data = parser.bmp_parser(fs.readFileSync('./1.bmp'));

var info_header = data.BITMAPINFOHEADER;
var bmp = parser.bmp_builder({
            width     : info_header.LONGbiWidth,
            height    : info_header.LONGbiHeight,
            bit_count : info_header.WORDbiBitCount
          });

bmp.pixals.forEach(function( pixal, idx ) {
  bmp.pixals[idx] = data.pixals[idx];
});

data.palette.forEach(function( palette, idx ) {
  util._extend(bmp.palette[idx],palette);
});

var bmpbuf  = bmp.out();

var bmpfile = fs.createWriteStream('./2.bmp');
bmpfile.write( bmpbuf, function( err ) {});

