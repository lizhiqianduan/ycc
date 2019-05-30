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
					'src/Ycc.Tree.class.js',
					'src/Ycc.Graph.class.js',
					'src/Ycc.Ticker.class.js',
					'src/Ycc.Debugger.class.js',
					'src/Ycc.Loader.class.js',
					'src/Ycc.Ajax.class.js',
					'src/Ycc.Event.class.js',
					'src/Ycc.Listener.class.js',
					'src/Ycc.TouchLifeTracer.class.js',
					'src/Ycc.Gesture.class.js',
					'src/Ycc.Layer.class.js',
					'src/Ycc.LayerManager.class.js',
					'src/Ycc.PhotoManager.class.js',
					'src/Ycc.UI.class.js',
					'src/Ycc.UI.Base.class.js',
			
					// ui
					'src/Ycc.UI.Polygon.class.js',
					'src/Ycc.UI.Ellipse.class.js',
					'src/Ycc.UI.Circle.class.js',
					'src/Ycc.UI.Image.class.js',
					'src/Ycc.UI.ImageFrameAnimation.class.js',
					'src/Ycc.UI.Line.class.js',
					'src/Ycc.UI.BrokenLine.class.js',
					'src/Ycc.UI.MultiLineText.class.js',
					'src/Ycc.UI.Rect.class.js',
					'src/Ycc.UI.CropRect.class.js',
					'src/Ycc.UI.SingleLineText.class.js',
					
					// 组件
					'src/Ycc.UI.ComponentButton.class.js',
			
					// polyfill
					'src/Ycc.polyfill.wx.js',
					'src/Ycc.polyfill.export.js',
		
				],
				dest: 'build/ycc.js'
			}
        },
        uglify:{
			// 压缩ycc文件
			lib:{
				options: {
					sourceMap:true
				},
				files:[
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
			contents:["docs","build"]
		}
        
        ,watch:{
			options: {
				livereload: 9000
			},
			files:["./src/*.js","./GruntFile.js"],
            tasks: ["clean","concat","uglify"]
        },
		// copy:[
		// 		{expand:true,cwd:"./src", src: '*.js', dest: 'build/'}
  		// 	]/*.concat(fs.readdirSync("./examples").map(function (t) {
  		// 		return {expand:true,cwd:"./build", src: '*.js', dest: 'examples/'+t+'/lib/'};
  		// 	}))*/
		
    });

    
    
    
    grunt.config.merge(require('./examples/game-super-mario/game-super-mario-grunt-config'));
    
    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-jsdoc');
    // 默认被执行的任务列表。
    grunt.registerTask('default', ['watch']);
    // build任务：不生成文档，只生成最终的ycc.js
	grunt.registerTask('build', ["clean","concat","uglify"]);
	// release任务：生成文档，源代码的压缩文件
	grunt.registerTask('release', ["clean","concat","uglify","jsdoc"]);

	// super-mario任务
	grunt.registerTask('build:game_super_mario', ["clean:game_super_mario","concat:game_super_mario","uglify:game_super_mario","copy:game_super_mario"]);


};
