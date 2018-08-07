/**
 * @file    Ycc.Tree.class.js
 * @author  xiaohei
 * @date    2018/8/6
 * @description  Ycc.Tree.class文件
 */





(function (Ycc) {
	
	
	// 节点的自增id
	var nodeID = 0;

	/**
	 * 树的构造函数
	 * 若参数为空，默认创建只有一个根节点的树
	 * @constructor
	 */
	Ycc.Tree = function() {
		
		/**
		 * 节点的自增ID，不允许修改，且每个对象必须唯一
		 * @type {number}
		 */
		this.$id = nodeID++;

		/**
		 * 节点的父节点ID，不允许修改
		 * @type {null|Ycc.Tree}
		 */
		this.$parentID = null;
		
		/**
		 * 节点的子节点列表
		 * @type {Array}
		 */
		this.children = [];
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		this.data = null;
		
		// 存入map中，方便通过id寻找
		this.nodeMap[this.$id] = this;
	};
	
	
	/**
	 * 存储所有树节点的引用，不允许重载
	 * 使用prototype好处：
	 * 	1、所有Tree对象公用
	 * 	2、JSON.stringify不会将此序列化，避免抛循环引用的错误
	 * key为$id val为Tree对象
	 * @type {{}}
	 */
	Ycc.Tree.prototype.nodeMap = {};
	
	
	/**
	 * 添加一颗子树
	 * @param tree
	 */
	Ycc.Tree.prototype.addChildTree = function (tree) {
		if(tree.$parentID) return console.error("sub tree's parent has exist! can't add!",tree);
		tree.$parentID = this.$id;
		this.children.push(tree);
		return this;
	};
	
	/**
	 * 获取树的深度
	 * @return {number}
	 */
	Ycc.Tree.prototype.getDepth = function () {
		var self = this;
		var dep = 1;
		if(self.children.length>0){
			for(var i=0;i<self.children.length;i++){
				var subDep = self.children[i].getDepth();
				dep = subDep+1>2?subDep+1:2;
			}
		}
		
		return dep;
	};
	
	
	/**
	 * 树的迭代器，返回集中常用的迭代方法
	 * @param option 暂时不用
	 * @return {{each: each, leftChildFirst: leftChildFirst, rightChildFirst: rightChildFirst, depthDown: depthDown}}
	 */
	Ycc.Tree.prototype.itor = function (option) {
		var self = this;

		/**
		 * 父代优先遍历
		 * 先遍历父代，再依次遍历子代
		 * @param cb
		 */
		function each(cb) {
			cb(self);
			if(self.children.length>0){
				for(var i=0;i<self.children.length;i++){
					self.children[i].itor().each(cb);
				}
			}
		}
		
		/**
		 * 左树优先遍历
		 * 只要最左边的树不为空就继续遍历其子树，最后遍历根节点
		 * @param cb
		 */
		function leftChildFirst(cb) {
			if(self.children.length>0){
				for(var i=0;i<self.children.length;i++){
					self.children[i].itor().leftChildFirst(cb);
				}
			}
			cb(self);
		}
		
		/**
		 * 右树优先遍历
		 * 只要最右边的树不为空就继续遍历其子树，最后遍历根节点
		 * @param cb
		 */
		function rightChildFirst(cb) {
			if(self.children.length>0){
				for(var i=self.children.length-1;i>=0;i--){
					self.children[i].itor().rightChildFirst(cb);
				}
			}
			cb(self);
		}
		
		/**
		 * 根据当前节点，按层级依次向下遍历
		 * 这只是depthDownByNodes的特殊情况
		 * @param cb(node,layer)
		 */
		function depthDown(cb) {
			depthDownByNodes([self],cb);
		}
		
		/**
		 * 根据所给的节点列表，按层级依次向下遍历
		 * @param nodes {Ycc.Tree[]}
		 * @param cb(node,layer)
		 * @param [layer]	{number} 当前nodes列表所在的层级，可选参数
		 */
		function depthDownByNodes(nodes,cb,layer){
			if(nodes.length===0)
				return;
			layer=layer||0;
			layer++;
			var nextNodes = [];
			for(var i=0;i<nodes.length;i++){
				cb(nodes[i],layer);
				nextNodes = nextNodes.concat(nodes[i].children);
			}
			depthDownByNodes(nextNodes,cb,layer);
		}
		
		return {
			each:each,
			leftChildFirst:leftChildFirst,
			rightChildFirst:rightChildFirst,
			depthDown:depthDown
		};
	};
	
	
	/**
	 * 转化为节点列表
	 * @return {Array}
	 */
	Ycc.Tree.prototype.toNodeList = function () {
		var list = [];
		this.itor().depthDown(function (node) {
			list.push(node);
		});
		return list;
	};



/////////////////////////// static Methods
	
	/**
	 * 根据传入的json构造一棵树
	 *
	 * 若节点有数据必须包含data字段
	 * 若节点有子节点必须包含children字段，且为数组
	 * 只关注data和children字段，其他字段将忽略
	 *
	 * @param json{data,children} {object} json对象
	 * @return {Ycc.Tree}
	 */
	Ycc.Tree.createByJSON = function (json) {
		var root = new Ycc.Tree();
		root.data = json.data;
		if(Ycc.utils.isArray(json.children) && json.children.length>0){
			for(var i=0;i<json.children.length;i++){
				root.addChildTree(Ycc.Tree.createByJSON(json.children[i]));
			}
		}
		return root;
	};
	
	
	/**
	 * 根据传入的节点列表构造一棵树
	 *
	 * 只关注字段id,parentID
	 *
	 * 构造成功后将生成新的$id,$parentID，且所有字段都将放入data中，包括id和parentID
	 *
	 * @param nodes {Array[]} json对象数组
	 * @return {Ycc.Tree}
	 */
	Ycc.Tree.createByNodes = function (nodes) {
		
		if(!Ycc.utils.isArray(nodes) || nodes.length===0)
			return console.error('need an Array as param!');
		
		var root = null;
		
		var treeNodes = [];
		nodes.forEach(function (node) {
			var treeNode = new Ycc.Tree();
			treeNode.data = node;
			treeNodes.push(treeNode);
			if(!Ycc.utils.isNum(node.parentID) && !node.parentID)
				root = treeNode;
		});
		
		
		treeNodes.forEach(function (treeNode) {
			treeNodes.forEach(function (subNode) {
				if(subNode.data.parentID === treeNode.data.id){
					treeNode.addChildTree(subNode);
				}
			});
		});
		
		return root;
	};
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
})(window.Ycc);