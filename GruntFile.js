/**
 * Created by xiaohei on 2016/4/1.
 */
var grunt = require("grunt");

module.exports = function(grunt){
	
	
    grunt.initConfig({
        concat:{
                options: {
                    separator: ';'
                },
                target: {
                    src: [
                    	'src/Ycc.class.js',
                        'src/Ycc.init.js',
                        'src/Ycc.utils.js',
                        'src/ycc.node.js',
                        //'src/ycc.node_attr.js',
                        'src/ycc.painter.js',
                        'src/ycc.app.class.js'
                    ],
                    dest: 'build/ycc.js'
                }

        },
        uglify:{
            my_target:{
				options: {
					sourceMap:true
				},
                files: [
					{
						expand: true,
						src: ['*.js', '!*.min.js'],
						dest: 'build',
						cwd: './src',
						rename: function (dst, src) {
							return dst + '/' + src.replace('.js', '.min.js');
						}
					},
                    {
                        'build/ycc.min.js': ['build/ycc.js']
                    }
                ]
            }
        }
        ,jsdoc:{
			src: ['src/*.js'],
			options: {
				destination: 'docs',
				private:true
			}
		}
		
		,clean:{
			contents:["docs/*","build/*"]
		}
        
        ,watch:{
			options: {
				livereload: 9000
			},
			files:["./src/*.js","./test/*.html","./GruntFile.js"],
            tasks: ["clean","concat","uglify","jsdoc"]
        }
    });

    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-jsdoc');
    // 默认被执行的任务列表。
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['concat','uglify']);
};
