var Mixdown = require('mixdown');
var config = require( './mixdown.json');
var packageJSON = require('./package.json');
var util = require('util');
var fs = require('fs');
var path = require('path');

var mixdown = new Mixdown(config);

if (process.env.MIXDOWN_ENV) {
  var env;

  // foundation env overrides
  try {
    env = require('./mixdown-' + process.env.MIXDOWN_ENV + '.json');
    mixdown.env(env);
  }
  catch(e) {
    console.error(e);
    process.exit();
  }
}

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

mixdown.start(function(err) {

  logger.info(packageJSON.name + ' version: ' + packageJSON.version);

  if (err) {
    if (logger) {
      logger.error('Service did not start', err, err.stack);
    }
    console.log('Service did not start', err, err.stack);

    process.exit();
  }

  mixdown.on('configuration-change', function() {
    logger.info('Configuration changed. ');
  });

  mixdown.on('error', function(err) {
    logger.info(util.inspect(err));
  });

  mixdown.on('reload', function() {
    logger.info('Hot reload.');
  });


  var terminate = function() {
    mixdown.stop(process.exit);
  };

  var kill = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  kill.forEach(function(msg) {
    process.on(msg, terminate);
  });

});
