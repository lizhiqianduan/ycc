/**
 * @file    Ycc.Graph.class.js
 * @author  xiaohei
 * @date    2018/8/14
 * @description  Ycc.Graph.class文件
 *
 * 图的结构类，有向图、无向图等
 */

(function (Ycc) {
	
	// 节点唯一id
	var vid = 1;
	// 边的唯一id
	var eid = 1;
	// 图的唯一id
	var gid = 1;
	
	// 节点map key为$id val为有向顶点/无向顶点
	var vMap = {};
	// 边map key为$id val为有向边/无向边
	var eMap = {};

	
	/**
	 * 图的结构类
	 * @constructor
	 */
	Ycc.Graph = function (type) {
		/**
		 * 图的分类 1--有向图  2--无向图
		 * @type {number}
		 */
		this.type = type||1;
		
		/**
		 * 图的id
		 * @type {number}
		 */
		this.$id = gid++;

		/**
		 * 图包含的顶点
		 * @type {Ycc.Graph.DirectedV[] | Ycc.Graph.UnDirectedV[]}
		 */
		this.vList = [];

		/**
		 * 图包含的边
		 * @type {Ycc.Graph.E[]}
		 */
		this.eList = [];
	};
	
	
	/**
	 * 获取顶点的map
	 * @return {{}}
	 */
	Ycc.Graph.prototype.getMapV = function () {
		return vMap;
	};
	
	/**
	 * 获取边的map
	 * @return {{}}
	 */
	Ycc.Graph.prototype.getMapE = function () {
		return eMap;
	};
	
	
	/**
	 * 广度优先搜索
	 * @param vArrId 顶点$id数组，代表从哪些顶点开始遍历
	 * @param cb 回调函数
	 *   若回调函数返回true，则遍历结束
	 * @param [vSearchedId] 已遍历的$id数组
	 *
	 * @return {boolean}
	 */
	Ycc.Graph.prototype.bfs = function (vArrId,cb,vSearchedId) {
		vArrId = vArrId||[];
		vSearchedId = vSearchedId || [];

		// 递归结束条件
		if(vArrId.length===0){
			if(vSearchedId.length===this.vList.length)
				return true;
			
			// 已遍历的个数与图顶点的总个数不等，说明该图存在孤立部分，任取一个孤立部分的顶点，继续遍历
			var tempID = null;
			for(var j=0;j<this.vList.length;j++){
				if(vSearchedId.indexOf(this.vList[j].$id)===-1){
					tempID=this.vList[j].$id;
					break;
				}
			}
			return this.bfs([tempID],cb,vSearchedId);
		}
		
		// 修改已遍历的顶点
		var v = null;
		for(var i=0;i<vArrId.length;i++){
			v = vMap[vArrId[i]];
			if(cb.call(this,v)) return true;
			vSearchedId.push(v.$id);
		}
		
		// 下一层需要遍历的节点
		var next = [];
		for(var k=0;k<vArrId.length;k++){
			v = vMap[vArrId[k]];
			var temp =  v.getToIDs().filter(function (id) {
				return vSearchedId.indexOf(id)===-1;
			});
			next = next.concat(temp);
		}
		
		return this.bfs(next,cb,vSearchedId);
	};
	
	
	/**
	 * 创建一个有向图
	 * @static
	 * @param vArr {[{id,data,...}]} 顶点列表
	 * @param eArr {[{fromId,toId,data,...}]}	边列表
	 */
	Ycc.Graph.createDirectedGraph  = function (vArr,eArr) {
		var graph = new Ycc.Graph(1);
		var vList = graph.vList;
		var eList = graph.eList;
		
		vArr.forEach(function (v) {
			vList.push(new Ycc.Graph.DirectedV(v));
		});
		
		eArr.forEach(function (e) {
			var from = null,to=null;
			var edge = new Ycc.Graph.DirectedE();
			for(var i =0;i<vList.length;i++){
				// 两个都找到了就跳出去
				if(from && to) break;
				var v = vList[i];
				if(v.data.id === e.fromId){
					from = v;
					v.outIDs.push(edge.$id);
				}
				if(v.data.id === e.toId){
					to = v;
					v.inIDs.push(edge.$id);
				}
			}
			edge.init(from.$id,to.$id,e);
			eList.push(edge);
		});
		return graph;
	};
	
	
	
	
	
	
	/**
	 * 有向图中的顶点类
	 * @param data 节点的数据
	 * @constructor
	 */
	Ycc.Graph.DirectedV = function (data) {
		/**
		 * 节点id
		 * @type {number}
		 */
		this.$id = vid++;
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		this.data = data;
		
		/**
		 * 节点的入边$id列表
		 * @type {number[]}
		 */
		this.inIDs = [];
		
		/**
		 * 节点的出边$id列表
		 * @type {number[]}
		 */
		this.outIDs = [];
		
		// 放入map，方便查找
		vMap[this.$id] = this;
	};
	
	/**
	 * 获取有向图中，某个节点指向的节点ID列表
	 * @return {Array}
	 */
	Ycc.Graph.DirectedV.prototype.getToIDs = function () {
		var ids = [];
		this.outIDs.forEach(function (id) {
			ids.push(eMap[id].toID);
		});
		return ids;
	};
	
	

	/**
	 * 有向图中的边类
	 * @constructor
	 */
	Ycc.Graph.DirectedE = function () {
		
		/**
		 * 边的id
		 * @type {number}
		 */
		this.$id = eid++;
		
		/**
		 * 边所携带的数据，比如权重
		 * @type {any}
		 */
		this.data = null;
		
		/**
		 * 边的起点$id
		 * @type {number}
		 */
		this.fromID = null;
		
		/**
		 * 边的终点$id
		 * @type {number}
		 */
		this.toID = null;
		
		// 放入map，方便查找
		eMap[this.$id] = this;
	};
	
	/**
	 * 有向图边的初始化
	 * @param fromID
	 * @param toID
	 * @param data
	 */
	Ycc.Graph.DirectedE.prototype.init = function (fromID, toID, data) {
		this.fromID = fromID;
		this.toID = toID;
		this.data = data;
	};
	
	
	
	
	/**
	 * 无向图中的顶点类
	 * @constructor
	 */
	Ycc.Graph.UnDirectedV = function () {
		/**
		 * 节点id
		 * @type {number}
		 */
		this.$id = vid++;
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		this.data = null;
		
		/**
		 * 节点的边列表
		 * @type {Ycc.Graph.UnDirectedE[]}
		 */
		this.listE = [];
	};
	

	
	/**
	 * 无向图中的边类
	 * @constructor
	 */
	Ycc.Graph.UnDirectedE = function () {
		
		/**
		 * 边的id
		 * @type {number}
		 */
		this.$id = eid++;
		
		/**
		 * 边所携带的数据，比如权重
		 * @type {any}
		 */
		this.data = null;
		
		/**
		 * 关联的两个顶点数组
		 * @type {Ycc.Graph.V[]}
		 */
		this.listV = [];
		
	};
	
	
	
	




})(window.Ycc);