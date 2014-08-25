require.config({
  baseUrl: './',
  paths : {
    'jquery' : 'http://cdn.staticfile.org/jquery/1.11.0/jquery',
    'knockout':'http://cdn.staticfile.org/knockout/3.1.0/knockout-debug',
    '_'       :'http://cdn.staticfile.org/underscore.js/1.6.0/underscore',
  },
  map : {
    '*' : {
      'ko' : 'knockout'
    }
  }
});

require([
  '../test/spirits/map',
  '../test/spirits/air',
  'knockout',
  'jquery'
],function(
  map,
  air,
  ko,
  $
){

  var root = '../test/spirits/';
  var animate = '198';
  function get_pic_src ( group, no ) {
    return root + group + '_' + no + '.bmp';
  }

  function set_img_attr ( img, group, no ) {
    var p_group = pic_map[group];
    var pic = p_group.filter(function( pic ) {
                return pic.no == no;
              })[0];
    img.style.width = pic.width;
    img.style.height= pic.height;
    img.src = get_pic_src(group,no);
  }

  var img = $('<img src="" alt="" />').appendTo('body');

  var interval = 1e3/20;
  var tickets  = 0;
  var pointer  = 0;
  var stages   = air_map[animate];
  console.log( stages );
  function runner () {
    var frame = stages[pointer];
    if( !frame ){
      return;
    }
    set_img_attr( img[0], frame.group, frame.no );
    if( tickets >= frame.counts ){
      pointer += 1;
      tickets =  0;
    } else {
      tickets += 1;
    }
    setTimeout(function() {
      runner();
    },interval)
  }
  runner();
});