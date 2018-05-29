const gulp = require('gulp');
const image = require('gulp-image');
const resize = require('gulp-image-resize');
const rename = require('gulp-rename');

// The following only needed to be run once on all images.

/**
 * Resize Old Images
 */
gulp.task('resize', function(done) {
  // Large
  gulp.src('src/public/old_images/**/*.jpg')
    .pipe(resize({
      upscale: false,
      quality: 0.77,
      width: 800,
    }))
    .pipe(rename(function(path) {
      path.basename += "-large";
    }))
    .pipe(gulp.dest('src/public/images'));

  // Medium
  gulp.src('src/public/old_images/**/*.jpg')
    .pipe(resize({
      percentage: 75,
      quality: 0.8
    }))
    .pipe(rename(function(path) {
      path.basename += "-medium";
    }))
    .pipe(gulp.dest('src/public/images'));

  // Small
  gulp.src('src/public/old_images/**/*.jpg')
    .pipe(resize({
      percentage: 50,
      quality: 0.8
    }))
    .pipe(rename(function(path) {
      path.basename += "-small";
    }))
    .pipe(gulp.dest('src/public/images'));

  return done();
});

/**
 * Optimize images
 */
gulp.task('optimize', function(done) {
  gulp.src('src/public/images/**/*')
    .pipe(image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      jpegRecompress: false,
      mozjpeg: ['-optimize', '-progressive'],
      guetzli: false,
      gifsicle: false,
      svgo: false,
      concurrent: 10,
    }))
    .pipe(gulp.dest('src/public/images'));

    return done();
});

gulp.task('default', gulp.series('resize', 'optimize'));
