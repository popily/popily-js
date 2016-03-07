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

gulp.task('build', ['scripts', 'styles']);

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


gulp.task('styles', function() {
  var sassOptions = {
    style: 'expanded'
  };

  var injectFiles = gulp.src(['src/popily.scss'], { read: false });

  var injectOptions = {
    transform: function(filePath) {
      filePath = filePath.replace('src/', '');
      return '@import "' + filePath + '";';
    },
    starttag: '// injector',
    endtag: '// endinjector',
    addRootSlash: false
  };


  return gulp.src(['src/popily.scss'])
    .pipe($.inject(injectFiles, injectOptions))
    .pipe($.sass(sassOptions)).on('error', errorHandler('Sass'))
    .pipe($.autoprefixer()).on('error', errorHandler('Autoprefixer'))
    .pipe(gulp.dest('./build'))
		.pipe($.rename({suffix: '.min'}))
    .pipe($.minifyCss())
    .pipe(gulp.dest('./build'));
});
