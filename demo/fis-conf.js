fis.config.merge({
  project : {
    exclude : /(bower_components|node_modules|\.(html|js|css|json))/i
  },
  //插件配置节点
  modules : {
    // 编译器插件配置节点
    parser : {
      jade : 'jade',
      less : 'less'
    }
  },
  roadmap : {
    ext : {
      jade : 'html',
      less : 'css'
    },
    //配置所有资源的domain
    path : [{
        reg : 'map.json',
        release : false
      },{
        reg     : /templates\/(.*\-?)layout\.jade/,
        release : '$1index.html',
        isHtmlLike:false,
        useCache: false
      },{
        reg     : '**.jade',
        release : false,
        useCache: false
      }]
  },
  deploy : {
    local : {
      to : './'
    }
  }
});