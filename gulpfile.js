const gulp = require('gulp');
// const imagemin = require('gulp-imagemin');
const image = require('gulp-image');

// gulp.task('default', () => {
//   return gulp.src('dist/images/**/*')
//     .pipe(imagemin([
//       imagemin.jpegtran({
//         progressive: true
//       }),
//       imagemin.optipng({optimizationLevel: 5}),
//     ], {
//       verbose: true
//     }))
//     .pipe(gulp.dest('dist/images'))
// });

gulp.task('default', function () {
  return gulp.src('dist/images/**/*')
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
    .pipe(gulp.dest('dist/images'));
});