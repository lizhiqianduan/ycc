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
						'src/Ycc.class.js',
						'src/Ycc.utils.js',
						'src/Ycc.Math.js',
						'src/Ycc.Ticker.class.js',
						'src/Ycc.Loader.class.js',
						'src/Ycc.Event.class.js',
						'src/Ycc.Listener.class.js',
						'src/Ycc.Layer.class.js',
						'src/Ycc.LayerManager.class.js',
						'src/Ycc.PhotoManager.class.js',
						'src/Ycc.UI.class.js',
						'src/Ycc.UI.Base.class.js',
						
						// ui
						'src/Ycc.UI.Ellipse.class.js',
						'src/Ycc.UI.Image.class.js',
						'src/Ycc.UI.Line.class.js',
						'src/Ycc.UI.MultiLineText.class.js',
						'src/Ycc.UI.Rect.class.js',
						'src/Ycc.UI.CropRect.class.js',
						'src/Ycc.UI.SingleLineText.class.js',
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
					{'build/ycc.min.js': ['build/ycc.js']}
                ]
            }
        }
        ,jsdoc:{
			src: ['src/*.js'],
			options: {
				destination: 'docs',
				private:true,
				template:"./lib/jaguarjs-jsdoc"
			}
		}
		
		,clean:{
			contents:["docs/*","build/*","examples/*/lib/*"]
		}
        
        ,watch:{
			options: {
				livereload: 9000
			},
			files:["./src/*.js","./test/*.html","./GruntFile.js"],
            tasks: ["clean","concat","uglify","jsdoc","copy"]
        },
		copy:[
				{expand:true,cwd:"./src", src: '*.js', dest: 'build/'}
  			].concat(fs.readdirSync("./examples").map(function (t) {
  				return {expand:true,cwd:"./build", src: '*.js', dest: 'examples/'+t+'/lib/'};
  			}))
		
		
    });

    
    
    
    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-jsdoc');
    // 默认被执行的任务列表。
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ["clean","concat","uglify","jsdoc","copy"]);
};
