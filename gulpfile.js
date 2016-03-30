'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
      lazy: true,
      pattern: ['gulp-*', 'del']
    })
var browserSync = require('browser-sync');


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

gulp.task('build', ['api', 'scripts', 'geo', 'styles']);
gulp.task('deploy', ['api', 'min-scripts', 'min-geo', 'min-styles']);

gulp.task('clean', function () {
  return $.del(['build/']);
});

gulp.task('scripts', ['api'], function() {
//gulp.task('scripts', function() {
	// Single entry point to browserify 
	return gulp.src(['src/lib/d3.min.js',
            'src/lib/d3-tip.js',
            'src/lib/pathseg.js',
            'src/lib/c3.min.js',
            'src/lib/underscore.min.js',
            'src/lib/numeral.min.js',
            'build/popily-api.js',
            'src/popily.js',
            'src/analyze.js', 
            'src/chart-data.js',
            'src/dataset.js',
            'src/format.js', 
            'src/utils.js',  
            'src/label.js',  
            'src/chart-types/common/*.js', 
            'src/chart-types/*.js',
            '!src/chart-types/choropleth.js',
            '!src/chart-types/interactive-map.js',
            ])
	  .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError())
    .pipe($.sourcemaps.init())
	  .pipe($.concat('popily.js'))
    .pipe($.sourcemaps.write())
	  /*
    .pipe($.browserify({
		  insertGlobals : false,
		  debug : true
		}))
    */
    
		.pipe(gulp.dest('./build'))
		
});

gulp.task('geo', function() {

  var dataObjects = [];
  return gulp.src([
    'src/lib/d3.geomap.dependencies.min.js',
    'src/lib/d3.geomap.min.js',
    'src/lib/leaflet.min.js',
    'src/chart-types/choropleth.js',
    'src/chart-types/interactive-map.js',
    //'src/data/**/*', // uncomment to include all countries
    'src/data/world/*',
    'src/data/countries/USA-abbr.json',
    'src/data/countries/USA.json',
    ])
    .pipe($.if(/^d3.geomap.min.js$/, $.insert.transform(function(content, file) { 
      return content.replace('d3.json', 'newD3Json = function(f, cb) {cb(null, f)}, newD3Json');
    })))
    .pipe($.if(/.json$/, $.insert.transform(function(content, file) {
      var name = file.path.split('src/')[1].replace(/\//g, '.').replace(/-/g, '').slice(0, -5);
      var newContent = '';
      var prefix = 'window.popily.chart';
      var path = '';
      name.split('.').forEach(function(part) {
        path = path +'.'+ part;
        if(dataObjects.indexOf(path) === -1 && path != '.'+name) {
          newContent +=  prefix + path + '={};\r\n';
        }
        dataObjects.push(path);
      });
      newContent += prefix +'.'+ name + '=' + content + ';\r\n';
      return newContent;
    })))
    .pipe($.sourcemaps.init())
	  .pipe($.concat('popily-geo.js'))
    .pipe($.sourcemaps.write())
		.pipe(gulp.dest('build'));
});

gulp.task('min-scripts', ['scripts', ], function() {
	return gulp.src(['build/popily.js'])
		.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest('./build'));
});

gulp.task('min-geo', ['geo', ], function() {
	return gulp.src(['build/popily-geo.js'])
		.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest('./build'));
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
    .pipe($.concat('popily.css'))
    .pipe(gulp.dest('./build'))
});


gulp.task('min-styles', ['styles'], function() {
	return gulp.src(['build/popily.css'])
		.pipe($.rename({suffix: '.min'}))
    .pipe($.cleanCss())
    .pipe(gulp.dest('./build'));
})


gulp.task('api', function() {
	// Single entry point to browserify 
	return gulp.src('src/popily-api.js')
		.pipe($.browserify({
		  insertGlobals : false,
		  debug : true
		}))
		.pipe(gulp.dest('./build'))
		.pipe($.uglify())
		.pipe($.rename({suffix: '.min'}))
		.pipe(gulp.dest('./build'))
});



gulp.task('watch', ['scripts', 'geo', 'styles'], function() {
  browserSync.init({
    server: {
      baseDir: ["./", "./examples"] 
    }
  });
  gulp.watch(['src/**/*.js'], ['scripts', 'geo', browserSync.reload]);
  gulp.watch(['src/popily.scss'], ['styles', browserSync.reload]);
  gulp.watch(['examples/*.html', 'examples/*.js', 'tests/*.js', 'tests/*.html']).on('change', browserSync.reload);
});


