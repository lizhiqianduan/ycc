/**
 * Created by xiaohei on 2016/4/1.
 */
var grunt = require("grunt");
var fs = require("fs");

module.exports = function(grunt){
	
	
    grunt.initConfig({
        concat:{
			options: {
				separator: ';'
			},
			target: {
				src: [
					// core
					'../../build/ycc.js',
					// './lib/matter-js/matter.js',
					'./Loading.js',
					'./GameScene.js',
					'./GameScene.ui.js',
					'./level_1_1.js',
					'./level_1_2.js',
					'./level_1_3.js',
					'./level_1_4.js',
					'./main.js',
				],
				dest: './dist/src.js'
			}
        },
		clean:{
			contents:["dist"]
		},
		uglify:{
		
			// 单独压缩src文件
			dist:{
				options: {
					sourceMap:false
				},
				files: [
					{
						expand: true,
						src: ['dist/src.js', '!*.min.js'],
						dest: 'dist',
						rename: function (dst, src) {
							return src.replace('.js', '.min.js');
						}
					}
				]
			},
		}
		
    });

    
    
    
    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	// grunt.loadNpmTasks('grunt-contrib-copy');
	// grunt.loadNpmTasks('grunt-jsdoc');
    // 默认被执行的任务列表。
    grunt.registerTask('default', ['concat']);
    // build任务：不生成文档，只生成最终的ycc.js
	grunt.registerTask('build', ["clean","concat","uglify:dist"]);
	// release任务：生成文档，源代码的压缩文件
	// grunt.registerTask('release', ["clean","concat","uglify","jsdoc"]);
};
