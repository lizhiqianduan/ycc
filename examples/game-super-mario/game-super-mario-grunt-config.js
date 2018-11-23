/**
 * @file    game-super-mario-grunt-config.js
 * @author  xiaohei
 * @date    2018/11/23
 * @description  game-super-mario-grunt-config文件
 */



// 根目录
var root = './examples/game-super-mario/';

module.exports = {
	concat:{
		game_super_mario: {
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
			].map(function (t) { return root+t; }),
			dest: root+'./dist/src.js'
		}
	},
	clean:{
		game_super_mario:{
			contents:[root+"dist"]
		}
	},
	uglify:{
		game_super_mario:{
			options: {
				sourceMap:false
			},
			files: [
				{
					expand: true,
					src: [root+'dist/src.js'],
					dest: root+'dist',
					rename: function (dst, src) {
						return src.replace('.js', '.min.js');
					}
				}
			]
		},
	}
	
};