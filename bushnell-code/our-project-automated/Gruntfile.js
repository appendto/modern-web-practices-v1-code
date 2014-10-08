module.exports = function(grunt) {
    // Project configuration
    grunt.initConfig({
        // Our concatenate task
        concat: {
            dist: {
                // Grab the needed .js files in our javascript/ directory
                src: [
                    'javascript/chat.js',
                    'javascript/date.js',
                    'javascript/welcome.js'
                ],
                dest: 'javascript/scripts.js', // Concatenate them into this new file
            }
        },
        // Our JavaScript minification task
        uglify: {
            main: {
                // Destination file : source file(s)
                files: {
                    'javascript/scripts.js': ['javascript/scripts.js']
                }
            }
        },
        // Our vendor prefixing task
        autoprefixer: {
            main: {
                src: 'css/styles.css',
                dest: 'css/main.css'
            },
        },
        // Our HTML include task
        includes: {
            files: {
                cwd: '_source', // Set the working directory to _source
                src: ['*.html'], // Find all of the .html files in the _source directory
                dest: '.' // Compile HTML files with included content into the root
            }
        },
        // Our watch task that, upon save to any file in the "files" property will run the tasks in the "tasks" property
        watch: {
            // If we save one of the files, run the "concat" and "uglify" tasks
            javascript: {
                files: [
                    'javascript/chat.js',
                    'javascript/date.js',
                    'javascript/welcome.js'
                ],
                tasks: ['concat', 'uglify'],
            },
            // If we save one of the files, run the "autoprefixer" task
            css: {
                files: ['css/styles.css'],
                tasks: ['autoprefixer'],
            },
            // If we save one of the files, run the "includes" task
            html: {
                files: ['_source/*.html', '_includes/*.html'],
                tasks: ['includes']
            }
        }
    });

    // Request our plugins by name
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-includes');

    // Our "default" task
    grunt.registerTask('default', [
        'concat', // Run the concatenate task
        'uglify', // Run the uglification task
        'autoprefixer', // Run the autoprefixer task
        'includes', // Run the includes task
        'watch' // Run the watch task
    ]);
};