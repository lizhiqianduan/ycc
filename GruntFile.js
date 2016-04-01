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
                    src: ['src/ycc.utils.js','src/ycc.js'],
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
            files:"./src/*.js",
            tasks: ["concat","uglify"]
        }


    });

    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // 默认被执行的任务列表。
    grunt.registerTask('default', ['watch']);
};
