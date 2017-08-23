'use strict';

const cluster = require('cluster');
const UglifyJS = require("uglify-js");
const server=require('node-http-server');
const numCPUs = require('os').cpus().length;

const config=server.configTemplate();
config.port             = null;
config.domain           = 'cdn.diginow.it';
config.root             = `${__dirname}/node_modules/`;
config.server.index     = 'index.html';
config.https            ={
    privateKey:`${__dirname}/certs/server.key`,
    certificate:`${__dirname}/certs/server.pub`,
    port:4433,
    only:true
}

if (cluster.isMaster) {

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

} else {

  // serve raw for now
  // server.beforeServe=beforeServe;

  function beforeServe(req,res,body,enc){
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
