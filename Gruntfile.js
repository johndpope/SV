module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'loopback_auto': {
      'db_autoupdate': {
        options: {
          dataSource: 'mongodb',
          app: './server/server',
          config: './server/model-config',
          method: 'autoupdate'
        }
      },
      'db_automigrate': {
        options: {
          dataSource: 'mongodb',
          app: './server/server',
          config: './server/model-config',
          method: 'automigrate'
        }
      }
    }
  });

  // Load the plugin
  grunt.loadNpmTasks('grunt-loopback-auto');
  grunt.registerTask('default', ['loopback_auto']);
};