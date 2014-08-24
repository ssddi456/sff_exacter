var parser = require('./parser');



function pcx_to_bmp ( source, act_source ) {
  var pcx = parser.pcx_parser(source);
  var option = {
    bit_count : 8,
    width     : pcx.header.hRes,
    height    : pcx.header.vRes
  };
  var bmp = parser.bmp_builder( option );
  parser.act_parser( act_source ).forEach(function( palette, idx ) {
    bmp.palette[idx] = palette;
  });
  bmp.palette.reverse();
  pcx.pixals.forEach(function( pixel, idx ){
    var w = idx % option.width;
    // reverse height
    var h = option.height - Math.ceil( idx / option.width );
    bmp.pixals[h * option.width + w] = pixel;
  });
  return bmp.out();
}


module.exports = {
  pcx_to_bmp : pcx_to_bmp
};