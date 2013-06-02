/*! Gruntfile.js */

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Project configuration.
  grunt.initConfig({

    // https://github.com/gruntjs/grunt-contrib-jshint
    jshint: {
      all: {
        src: ['./*.js', '*/*.js', 'test/*/*.js']
      },
      options: {
        // eqnull: true,
        // proto: true
      }
    },

    // https://github.com/pghalliday/grunt-mocha-test
    mochaTest: {
      all: {
        src: ['test/*.test.js']
      },
      options: {
        reporter: 'spec'
      }
    },

    // https://github.com/krampstudio/grunt-jsdoc-plugin
    jsdoc: {
      all: {
        src: ['core/*.js', 'storage/*.js', 'mixin/*.js']
      },
      options: {
        destination: 'gh-pages/docs'
      }
    },

    // https://github.com/jmreidy/grunt-browserify
    browserify: {
      all: {
        files: {
          'public/js/kagodb.browserify.js': ['public/src/export.js']
        }
      }
    },

    // https://github.com/gruntjs/grunt-contrib-uglify
    uglify: {
      all: {
        files: {
          'public/js/kagodb.min.js': ['public/js/kagodb.browserify.js']
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('browserify', ['browserify', 'uglify']);
  grunt.registerTask('all', ['default', 'jsdoc', 'browserify']);
};