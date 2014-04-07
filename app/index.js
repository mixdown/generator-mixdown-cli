'use strict';
var util = require('util');
var path = require('path');
var fs = require('fs');
var yeoman = require('yeoman-generator');

var MixdownGenerator = module.exports = function MixdownGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });
};

util.inherits(MixdownGenerator, yeoman.generators.Base);

MixdownGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // have Yeoman greet the user.
  console.log(this.yeoman);

  var prompts = [];

  prompts.push({
    name: 'packageName',
    message: 'What would you like to name this app?',
    default: this._.last(process.cwd().split(path.sep))
  });

  prompts.push({
    name: 'serviceNames',
    message: 'Services (comma separated).  Ex: service1, service2',
    default: 'service1'
  });

  if(prompts.length !== 0) {
    this.prompt(prompts, function (props) {
      this.packageName = props.packageName ? props.packageName.replace(/\s/g, '-') : null;
      this.packageDescription = props.packageDescription;
      this.serviceNames = props.serviceNames;

      cb();
    }.bind(this));
  }
  else {
    cb();
  }
};

MixdownGenerator.prototype.app = function app() {

  var packageJSON = require(path.join(__dirname, '../app/templates/_package.json'));
  var oldPackageJSON = fs.existsSync(path.join(process.cwd(),'/package.json'))
                          ? require(path.join(process.cwd(),'/package.json'))
                          : {};

  packageJSON.name = this.packageName;
  packageJSON.description = this.packageDescription;

  this._.defaults(packageJSON.dependencies, oldPackageJSON.dependencies);
  this._.defaults(packageJSON.devDependencies, oldPackageJSON.devDependencies);
  this._.defaults(packageJSON.scripts, oldPackageJSON.scripts);

  // write package.json
  this.write('package.json', JSON.stringify(packageJSON, null, 2));

  this.mkdir('./services');

  var services = this.serviceNames ? this.serviceNames.split(',') : [];
  var serviceJsonTemplate = require(path.join(__dirname, '../app/templates/' + './services/' + 'service.json'));
  var self = this;

  services.forEach(function(s) {
    var serviceJson = self._.cloneDeep(serviceJsonTemplate);
    s = self._.dasherize(s);
    serviceJson.id = s;

    self.write('./services/' + s + '.json', JSON.stringify(serviceJson, null, 2));
  });

  this.copy('index.js', 'index.js');
  this.copy('delegate.js', 'delegate.js');
  this.copy('README.md', 'README.md');

  this.mkdir('plugins');
  this.directory('plugins', 'plugins');

  var mixdown = require(__dirname + "/templates/mixdown.json");
  mixdown.logger.name = this.packageName;
  this.write('mixdown.json',JSON.stringify(mixdown,null,2));

  // copy gitignore if it doesn't exisit
  var pathGitIgnore = path.join(process.cwd(),'/.gitignore');
  var gitignore = fs.existsSync(pathGitIgnore) ? fs.readFileSync(pathGitIgnore) : '';
  gitignore += '\n' + fs.readFileSync(path.join(__dirname, '../app/templates/_gitignore'));
  this.write('.gitignore', gitignore);

};

MixdownGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
};
