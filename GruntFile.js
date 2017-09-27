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
                        'src/ycc.init.js',
                        'src/ycc.utils.js',
                        'src/ycc.node.js',
                        //'src/ycc.node_attr.js',
                        'src/ycc.painter.js',
                        'src/ycc.app.class.js'],
                    dest: 'build/ycc.js'
                }

        },
        uglify:{
            my_target:{
                files: {
                    'build/ycc.min.js': ['build/ycc.js'],
                }
            }
        }
        ,watch:{
			options: {
				livereload: 9000
			},
		
			files:["./src/*.js","./test/*.html","./GruntFile.js"],

            tasks: ["concat","uglify"]
        }
    });

    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // 默认被执行的任务列表。
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['concat','uglify']);
};
