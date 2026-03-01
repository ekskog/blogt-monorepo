import purify from 'purify-css'; // Use import instead of require
import fs from 'fs'; // Import Node's filesystem module

const content = ['src/**/*.vue', 'src/**/*.js']; // Paths to Vue and JS files
const css = ['src/assets/**/*.css', 'src/**/*.css']; // Paths to CSS files

const options = {
  output: 'dist/purified.css', // Output file path
  minify: true, // Minify the result
  info: true, // Output stats
  rejected: true, // Show unused CSS selectors
};

// Perform CSS purification
purify(content, css, options, (result) => {
  fs.writeFileSync('dist/purified.css', result); // Write purified CSS to file
  console.log('Purified CSS written to dist/purified.css');
});
