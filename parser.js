var fs = require('fs');
var source = fs.readFileSync('12.sff');


function sff_parser ( source ) {
  var total  = source.length;
  var signature = source.toString('utf8').slice(0,12);        // 00-11 "ElecbyteSpr\0" signature [12]
  var signature_len = Buffer(signature).length;
  var pointer = signature_len;
  var version   = source.readUInt8(pointer).toString();   // 12-15 1 verhi, 1 verlo, 1 verlo2, 1 verlo3 [04]
      version  += source.readUInt8(pointer+1).toString();
      version  += source.readUInt8(pointer+2).toString();
      version  += source.readUInt8(pointer+3).toString();
  
  var header = {
    signature      : signature,
  // HEADER (512 bytes)
  // ------
  // Bytes
    version        : version ,
    groups         : source.readUInt32LE(16),// 16-19 Number of groups [04]
    imgs           : source.readUInt32LE(20),// 20-24 Number of images [04]
    first_pos      : source.readUInt32LE(24),// 24-27 File offset where first subfile is located [04]
    sub_header_len : source.readUInt32LE(28),// 28-31 Size of subheader in bytes [04]
    palette_type   : source.readUInt8(32),// 32 Palette type (1=SPRPALTYPE_SHARED or 0=SPRPALTYPE_INDIV) [01]
                                            // 33-35 Blank; set to zero [03]
    file_comment   : source.slice(36,512)
                      .toString().replace(/\u0000/g,''),// 36-511 Blank; can be used for comments [476]
  };
  var subfiles = [];
  pointer = header.first_pos;
  var next;
  var len;
  while(true){
    next = source.readUInt32LE( pointer    );// 00-03  File offset where next subfile in the "linked list" is [04]
                                             // located. Null if last subfile
    len  = source.readUInt32LE( pointer+4  );// 04-07 Subfile length (not including header) [04]
                                             // Length is 0  if it is a linked sprite
    subfiles.push({
      next       : next,
      len        : len,
      is_linked  : len == 0,
      offsetX    : source.readUInt16LE( pointer+8  ),// 08-09 Image axis X coordinate [02]
      offsetY    : source.readUInt16LE( pointer+10 ),// 10-11 Image axis Y coordinate [02]
      group      : source.readUInt16LE( pointer+12 ),// 12-13 Group number [02] 
      no         : source.readUInt16LE( pointer+14 ),// 14-15 Image number (in the group) [02]
      prevcopy   : source.readUInt16LE( pointer+16 ),// 16-17 Index of previous copy of sprite (linked sprites only) [02]
                                                  // This is the actual
      samepalt   : source.readUInt8   ( pointer+18 ),//18 True if palette is same as previous image [01] 
      comment    : source.slice       ( pointer+19, pointer+32 )
                    .toString().replace(/\u0000/g,''),//19-31 Blank; can be used for comments [14]
      pcx        : len != 0 && pcx_parser( source.slice(pointer+32,pointer+32+len)),
    });
    pointer     = next;
    if( next==0 || total <= next ){
      break;
    }
  }

  return {
    header   : header,
    subfiles : subfiles
  };
}

function pcx_parser ( source ) {
  var header ={
    Manufacturer  : source.readUInt8(0),//.Manufacturer   resb    1       ; should always be 0Ah
    Version       : source.readUInt8(1),//.Version        resb    1       ; (1)
    Encoding      : source.readUInt8(2),//.Encoding       resb    1       ; should always be 01h
    BitsPerPixel  : source.readUInt8(3),//.BitsPerPixel   resb    1       ; (2)
    XMin          : source.readUInt16LE(4),//.XMin           resw    1       ; image width = XMax-XMin
    YMin          : source.readUInt16LE(6),//.YMin           resw    1       ; image height = YMax-YMin
    XMax          : source.readUInt16LE(8),//.XMax           resw    1
    YMax          : source.readUInt16LE(10),//.YMax           resw    1
    hRes          : source.readUInt16LE(12),//.YMax           resw    1
    vRes          : source.readUInt16LE(14),//.YMax           resw    1
    Palette       : source.slice(16,16+48),//.Palette        resb    48      ; (4)
    Reserved      : source.readUInt8(64),//.Reserved       resb    1
    ColorPlanes   : source.readUInt8(65),//.ColorPlanes    resb    1       ; (5)
    BytesPerLine  : source.readUInt16LE(66),//.BytesPerLine   resw    1       ; (6)
    PaletteType   : source.readUInt16LE(68),//.PaletteType    resw    1
    filler        : source.slice(70,70+58),//.VScrSize       resw    1       ; PC Paintbrush IV or higher
  };
  var pointer = 128;
  var body = {};
  return header;
}

function bmp_parser ( source ) {
  var BITMAPFILEHEADER = {
    WORDbfType      : source.slice(0,2).toString(),//位图文件的类型，必须为BM(1-2字节)
    DWORDbfSize     : source.readUInt32LE(2),//位图文件的大小，以字节为单位(3-6字节，低位在前)
    WORDbfReserved1 : source.readUInt16LE(6),//位图文件保留字，必须为0(7-8字节)
    WORDbfReserved2 : source.readUInt16LE(8),//位图文件保留字，必须为0(9-10字节)
    DWORDbfOffBits  : source.readUInt32LE(10),//位图数据的起始位置，以相对于位图(11-14字节，低位在前)
                                              //文件头的偏移量表示，以字节为单位
  };
  var BITMAPINFOHEADER = {
    DWORDbiSize         : source.readUInt32LE(14),//本结构所占用字节数(15-18字节)
    LONGbiWidth         : source.readUInt32LE(18),//位图的宽度，以像素为单位(19-22字节)
    LONGbiHeight        : source.readUInt32LE(22),//位图的高度，以像素为单位(23-26字节)
    WORDbiPlanes        : source.readUInt16LE(26),//目标设备的级别，必须为1(27-28字节)
    WORDbiBitCount      : source.readUInt16LE(28),//每个像素所需的位数，(29-30字节)必须是
                                                   //1  (双色)，
                                                   //4  (16色)，
                                                   //8  (256色)
                                                   //16 (高彩色)或
                                                   //24 (真彩色)之一
    DWORDbiCompression  : source.readUInt32LE(30),//位图压缩类型，(31-34字节)必须是
                                                  //0(不压缩)，
                                                  //1(BI_RLE8压缩类型)或
                                                  //2(BI_RLE4压缩类型)之一
    DWORDbiSizeImage    : source.readUInt32LE(34),//位图的大小(其中包含了为了补齐行数是4的倍数而添加的空字节)，以字节为单位(35-38字节)
    LONGbiXPelsPerMeter : source.readUInt32LE(38),//位图水平分辨率，每米像素数(39-42字节)
    LONGbiYPelsPerMeter : source.readUInt32LE(42),//位图垂直分辨率，每米像素数(43-46字节)
    DWORDbiClrUsed      : source.readUInt32LE(46),//位图实际使用的颜色表中的颜色数(47-50字节)
    DWORDbiClrImportant : source.readUInt32LE(50),//位图显示过程中重要的颜色数(51-54字节)
  };


  var pointer = 54;
  var RGBQUADbmiColors_len =  {
                                1 : 2,
                                4 : 16,
                                8 : 256
                              }[BITMAPINFOHEADER.WORDbiBitCount];
  var palette = [];

  for(var i = 0, len = Math.min(RGBQUADbmiColors_len || 0, BITMAPINFOHEADER.DWORDbiClrUsed);
      i < len; 
      i++
  ){
    palette.push({
      BYTErgbBlue     : source.readUInt8(pointer+i*4),//蓝色的亮度（值范围为0-255)
      BYTErgbGreen    : source.readUInt8(pointer+i*4+1),//绿色的亮度（值范围为0-255)
      BYTErgbRed      : source.readUInt8(pointer+i*4+2),//红色的亮度（值范围为0-255)
      BYTErgbReserved : 0,//保留，必须为0
    })
  }

  var pixals_starts = BITMAPFILEHEADER.DWORDbfOffBits;
  var pixals_counts = BITMAPINFOHEADER.LONGbiWidth * BITMAPINFOHEADER.LONGbiHeight;
  var bit_count     = BITMAPINFOHEADER.WORDbiBitCount;
  var pixals        = [];

  var line_bytes = Math.ceil((BITMAPINFOHEADER.LONGbiWidth*
                              BITMAPINFOHEADER.WORDbiBitCount/8)/4)*4;
  console.log( 'line_bytes', line_bytes);
  console.log( 'BITMAPFILEHEADER', BITMAPFILEHEADER);
  console.log( 'BITMAPINFOHEADER', BITMAPINFOHEADER);
  for(var h = 0, height = BITMAPINFOHEADER.LONGbiHeight;
      h< height;
      h ++ 
  ){
    for(i = 0, len = BITMAPINFOHEADER.LONGbiWidth;
        i < len; 
        i++
    ){

      if( bit_count == 8 ){
        pixals.push ( source.readUInt8( pixals_starts + i ) );
      } else {
        pixals.push({
          'B' : source.readUInt8( pixals_starts + i*3 + 0 ),
          'G' : source.readUInt8( pixals_starts + i*3 + 1 ),
          'R' : source.readUInt8( pixals_starts + i*3 + 2 ),
        });
      }

    }
    pixals_starts += line_bytes;
  }
  var bmp = {
    BITMAPFILEHEADER : BITMAPFILEHEADER,
    BITMAPINFOHEADER : BITMAPINFOHEADER,
    palette : palette,
    pixals  : pixals,
  };
  return bmp;
}

function write_with_struct( buffer, structs, data, offset ){
  var offset = offset || 0;
  structs.forEach(function( line ) {
    line = line.split(/,\s+/);
    var name  = line[0];
    var method= line[1];
    var info = data[name];
    if( buffer[method] ){
      var len   = 1*method.match(/\d+/)[0]/8;
    } else {
      len = method.length;
      info = method;
      method = 'write';
    }
    // console.log( name, method, info, offset );
    buffer[method](info,offset);
    offset += len;
  });
}
function bmp_builder ( info ) {
  var header_writes = [
    'WORDbfType,          BM',
    'DWORDbfSize,         writeUInt32LE',
    'WORDbfReserved1,     writeUInt16LE',
    'WORDbfReserved2,     writeUInt16LE',
    'DWORDbfOffBits,      writeUInt32LE',
    'DWORDbiSize,         writeUInt32LE',
    'LONGbiWidth,         writeUInt32LE',
    'LONGbiHeight,        writeUInt32LE',
    'WORDbiPlanes,        writeUInt16LE',
    'WORDbiBitCount,      writeUInt16LE',
    'DWORDbiCompression,  writeUInt32LE',
    'DWORDbiSizeImage,    writeUInt32LE',
    'LONGbiXPelsPerMeter, writeUInt32LE',
    'LONGbiYPelsPerMeter, writeUInt32LE',
    'DWORDbiClrUsed,      writeUInt32LE',
    'DWORDbiClrImportant, writeUInt32LE'
  ];
  var palette_writes = [
    'BYTErgbBlue,     writeUInt8',
    'BYTErgbGreen,    writeUInt8',
    'BYTErgbRed,      writeUInt8',
    'BYTErgbReserved, writeUInt8'
  ];
  var color24_writes = [
    'B,    writeUInt8',
    'G,    writeUInt8',
    'R,    writeUInt8'
  ];
  info.bit_count = info.bit_count || 16;
  var data = {
    WORDbfReserved1     : 0,
    WORDbfReserved2     : 0,
    DWORDbfOffBits      : 54,
    DWORDbiSize         : 40,
    LONGbiWidth         : info.width,
    LONGbiHeight        : info.height,
    WORDbiPlanes        : 1,
    WORDbiBitCount      : info.bit_count,
    DWORDbiCompression  : 0,
    LONGbiYPelsPerMeter : 1000,
    LONGbiXPelsPerMeter : 1000,
    DWORDbiClrUsed      : 0,
    DWORDbiClrImportant : 0
  };
  data.DWORDbiSizeImage = 
     ((Math.ceil((info.width * info.bit_count)/32)*32) / 8) * info.height;
  var RGBQUADbmiColors_len =  {
                                1 : 2,
                                4 : 16,
                                8 : 256
                              }[ info.bit_count];
  var palette = [];

  for(var i = 0, len = RGBQUADbmiColors_len || 0; i < len; i++){
    palette.push({
      BYTErgbBlue     : 0,//蓝色的亮度（值范围为0-255)
      BYTErgbGreen    : 0,//绿色的亮度（值范围为0-255)
      BYTErgbRed      : 0,//红色的亮度（值范围为0-255)
      BYTErgbReserved : 0,//保留，必须为0
    });
  }

  var pixals  = [];
  var pixals_counts = info.width * info.height;
  for(i = 0, len = pixals_counts || 0; i < len; i++){
    if( info.bit_count == 24 ){
      pixals.push({
        R : 0,
        G : 0,
        B : 0
      });
    } else {
      pixals.push (0);
    }
  }
  var buffer;
  // ['name, function']
  var ret = {
    palette : palette,
    pixals  : pixals,
    write_header : function() {
      write_with_struct( buffer, header_writes, data );
    },
    write_palette : function() {
      var offset = 54;
      for(var i = 0, len = palette.length; i< len; i++){
        write_with_struct( buffer, palette_writes, palette[i], 54 + i * 4 );
      }
    },
    write_pixals : function() {
      var offset = data.DWORDbfOffBits;
      // bmp each line of bytes must be %4 == 0
      var line_bytes = Math.ceil((info.width*info.bit_count/8)/4)*4;
      var pixal;
      var i = 0, w, width;
      for(var h = 0, height = info.height;
          h< height;
          h++
      ){

        for(w = 0, width = info.width;
          w< width;
          w ++,i++
        ){
          if( pixals[i].R == undefined ){ // dont care about 1 / 4 / 16
            buffer.writeUInt8( pixals[i], offset + w );
          } else {
            write_with_struct( buffer, color24_writes, pixals[i], offset + w * 3 )
          }
        }

        offset += line_bytes;
      }
    },
    out : function() {
      data.DWORDbiClrUsed      = palette.length;
      data.DWORDbiClrImportant = palette.length;
      data.DWORDbfOffBits      = 54 + palette.length * 4;
      data.DWORDbfSize         = data.DWORDbfOffBits + data.DWORDbiSizeImage;

      buffer = new Buffer( data.DWORDbfSize );
      buffer.fill(0);

      this.write_header();
      this.write_palette();
      this.write_pixals();
      return buffer;
    }
  }
  return ret;
}

module.exports = {
  sff_parser : sff_parser,
  pcx_parser : pcx_parser,
  bmp_parser : bmp_parser,
  bmp_builder: bmp_builder
};