const gulp = require('gulp')
const sourcemaps = require('gulp-sourcemaps')
const babel = require('gulp-babel')
const concat = require('gulp-concat')
const nodemon = require('gulp-nodemon')
const uglify = require('gulp-uglify')

const options = {
  daemon: {
    script: 'bin/www',
    ignore: 'public/**/*.*',
    ext: 'js json',
    env: {
      'NODE_ENV': 'development',
      'DEBUG': 'pi-dashboard:*',
    },
  },
}

/**
 * gulp task: build
 *  convert and compress source files
 */
gulp.task('build', () => {
  gulp.src('public/js/*.js')
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: [ '@babel/env' ],
      }))
      .pipe(concat('vendors.js'))
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('public/dist/js'))
})

/**
 * gulp task: dev
 *  start a dev server with nodemon
 */
gulp.task('dev', [ 'build' ], () => {
  nodemon(options.daemon)
})
