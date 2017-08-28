'use strict';

const cluster = require('cluster');
const UglifyJS = require("uglify-js");
const server=require('node-http-server');
const numCPUs = require('os').cpus().length;

const certPath='/etc/letsencrypt/live/cdn.diginow.it';

const config=new server.Config;
config.port             = 80;
config.domain           = 'cdn.diginow.it';
config.root             = `${__dirname}/node_modules/`;
config.server.index     = 'index.html';
config.https            = {
    privateKey:`${certPath}/privkey.pem`,
    certificate:`${certPath}/fullchain.pem`,
    port:4433,
    only:true
}

if (cluster.isMaster) {

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

} else {

  // serve raw for now
  server.beforeServe=beforeServe;
  function beforeServe(req,res,body,enc){
    res.setHeader('strict-transport-security','max-age=86400; includeSubDomains');

    if(req.uri.protocol!=='https'){
      res.statusCode = 301;
      res.setHeader(
        'location',
        `https://${req.uri.host}${req.url}`
      );
      serve(req,res);
      return  true;
    }

    if(!req.uri.query.min){
        return;
    }

    if(res.getHeader('Content-Type')!=server.config.contentType.js){
          return;
    }

    body.value=UglifyJS.minify(body.value);
  }

  server.deploy(config);
}
