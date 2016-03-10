'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
      lazy: true,
      pattern: ['gulp-*', 'del']
    })


/**
 *  Common implementation for an error handler of a Gulp plugin
 */
var errorHandler = function(title) {
  'use strict';

  return function(err) {
    $.util.log($.util.colors.red('[' + title + ']'), err.toString());
    this.emit('end');
  };
};

/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});

gulp.task('build', ['scripts']);

gulp.task('clean', function () {
  return $.del(['build/']);
});

gulp.task('scripts', function() {
	// Single entry point to browserify 
	gulp.src('src/popily.js')
		.pipe($.browserify({
		  insertGlobals : false,
		  debug : true
		}))
		.pipe(gulp.dest('./build'))
		.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest('./build'))
});


