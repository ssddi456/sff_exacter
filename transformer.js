var parser = require('./parser');



function pcx_to_bmp ( source, act_source, parsed ) {
  var pcx = parsed ? source : parser.pcx_parser(source);
  var act = parsed ? act_source : parser.act_parser( act_source );
  
  var option = {
    bit_count : 8,
    width     : pcx.header.hRes,
    height    : pcx.header.vRes
  };
  var bmp = parser.bmp_builder( option );

  act.forEach(function( palette, idx ) {
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

function sff_to_bmps( source, act_source ){
  var sff = parser.sff_parser( source );
  var act = parser.act_parser( act_source );
  var ret = [];
  sff.subfiles.forEach(function( subfile ){
    ret.push({
      name : subfile.group + '_' + subfile.no,
      bmp  : pcx_to_bmp(subfile.pcx, act, 'parsed')
    });
  });
  return ret;
}
function sff_to_bmp_with_json( source, act_source ) {
  var sff = parser.sff_parser( source );
  var act = parser.act_parser( act_source );
  var ret = [];
  var json = {};
  sff.subfiles.forEach(function( subfile, idx, arr ){
    if( subfile.is_linked ){ 
      var bmp = ret[ subfile.prevcopy ].bmp;
      var pcx = arr[ subfile.prevcopy ].pcx;
    } else {
      pcx = subfile.pcx;
      bmp = pcx_to_bmp(pcx, act, 'parsed');
    }
           
    ret.push({
      name : subfile.group + '_' + subfile.no,
      bmp  : bmp
    });

    var group = json[subfile.group] = (json[subfile.group]|| [])
    group.push({
      no : subfile.no,
      offsetX : subfile.offsetX,
      offsetY : subfile.offsetY,
      width   : pcx.hRes,
      height  : pcx.vRes
    });

  });
  return {
    spirits      : ret,
    spirits_info : json
  };
}

module.exports = {
  pcx_to_bmp           : pcx_to_bmp,
  sff_to_bmps          : sff_to_bmps,
  sff_to_bmp_with_json : sff_to_bmp_with_json,
};