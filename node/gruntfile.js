'use strict';
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['lib/**/*.js', 'test/**/*.js', '*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    shell: {
      test: {
        command: 'npm test'
      },
      run: {
        command: 'node server.js',
        options: {
          async: true
        }
      }
    },
    watch: {
      files: ['lib/**/*.js', 'test/**/*.js', 'config/**/*.yml', '*.js'],
      tasks: ['jshint', 'shell:test', 'shell:run'],
      options: {
        interrupt: true
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.registerTask('default', ['jshint', 'shell:test', 'shell:run', 'watch']);
  
};