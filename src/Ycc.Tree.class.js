/**
 * @file    Ycc.Tree.class.js
 * @author  xiaohei
 * @date    2018/8/6
 * @description  Ycc.Tree.class文件
 */





(function (Ycc) {
	
	
	// 节点的自增id
	var nodeID = 1;

	/**
	 * 存储所有树节点的引用，不允许重载
	 * 使用prototype好处：
	 * 	1、所有Tree对象公用
	 * 	2、JSON.stringify不会将此序列化，避免抛循环引用的错误
	 * key为$id val为Tree对象
	 * @type {{}}
	 */
	var nodeMap = {};

	/**
	 * 树的构造函数
	 * 若参数为空，默认创建只有一个根节点的树
	 * @constructor
	 */
	Ycc.Tree = function() {
		console.log('exec Tree');
		
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
		nodeMap[this.$id] = this;
	};
	
	/**
	 * 释放当前节点的内存，非递归
	 * @param treeNode
	 */
	Ycc.Tree.release = function (treeNode) {
		
		// 删除父级children的引用
		var pa = treeNode.getParent();
		if(pa){
			var children = pa.children;
			var index = children.indexOf(treeNode);
			if(index!==-1)
				children[index]=null;
		}
		
		// 删除nodeMap引用
		delete nodeMap[treeNode.$id];
		
		/**
		 * 节点的子节点列表
		 * @type {Array}
		 */
		treeNode.children.length = 0;
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		treeNode.data = null;
	};
	
	/**
	 * 获取nodeMap表
	 * @return {{}}
	 */
	Ycc.Tree.getNodeMap = function () {
		return nodeMap;
	};

	/**
	 * 获取nodeMap表
	 * @return {{}}
	 */
	Ycc.Tree.prototype.getNodeMap = function () {
		return nodeMap;
	};
	
	/**
	 * 获取父级
	 * @return {Ycc.Tree}
	 */
	Ycc.Tree.prototype.getParent = function () {
		if(!this.$parentID) return null;
		
		return nodeMap[this.$parentID];
	};
	
	
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
				dep = subDep+1>dep?subDep+1:dep;
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
		 * 若cb返回true，则停止遍历
		 * @param cb
		 * @return {boolean}
		 */
		function each(cb) {
			if(cb.call(self,self)) return true;
			if(self.children.length>0){
				for(var i=0;i<self.children.length;i++){
					if(self.children[i].itor().each(cb)) return true;
				}
			}
			return false;
		}
		
		/**
		 * 左树优先遍历
		 * 只要最左边的树不为空就继续遍历其子树，最后遍历根节点
		 * 若cb返回true，则停止遍历
		 *
		 * @param cb
		 * @return {boolean}
		 */
		function leftChildFirst(cb) {
			if(self.children.length>0){
				for(var i=0;i<self.children.length;i++){
					if(self.children[i].itor().leftChildFirst(cb)) return true;
				}
			}
			if(cb.call(self,self)) return true;
		}
		
		/**
		 * 右树优先遍历
		 * 只要最右边的树不为空就继续遍历其子树，最后遍历根节点
		 * 若cb返回true，则停止遍历
		 *
		 * @param cb
		 * @return {boolean}
		 */
		function rightChildFirst(cb) {
			if(self.children.length>0){
				for(var i=self.children.length-1;i>=0;i--){
					if(self.children[i].itor().rightChildFirst(cb)) return true;
				}
			}
			if(cb.call(self,self)) return true;
		}
		
		/**
		 * 根据当前节点，按层级依次向下遍历
		 * 这只是depthDownByNodes的特殊情况
		 * 若cb返回true，则停止遍历
		 *
		 * @param cb(node)
		 * @return {boolean}
		 */
		function depthDown(cb) {
			depthDownByNodes([self],cb);
		}
		
		/**
		 * 根据所给的节点列表，按层级依次向下遍历
		 * 若cb返回true，则停止遍历
		 *
		 * @param nodes {Ycc.Tree[]}
		 * @param cb(node,layer)
		 * @param [layer]	{number} 当前nodes列表所在的层级，可选参数
		 * @return {boolean}
		 */
		function depthDownByNodes(nodes,cb,layer){
			if(nodes.length===0)
				return true;
			layer=layer||0;
			layer++;
			var nextNodes = [];
			// 是否停止遍历下一层的标志位
			var breakFlag = false;
			for(var i=0;i<nodes.length;i++) {
				// 如果返回为true，则表示停止遍历下一层
				if (cb.call(self, nodes[i], layer)) {
					breakFlag = true;
					break;
				}
				nextNodes = nextNodes.concat(nodes[i].children);
			}
			if(breakFlag){
				nextNodes = [];
			}
			return depthDownByNodes(nextNodes,cb,layer);
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
	 * @return {Ycc.Tree[]}
	 */
	Ycc.Tree.prototype.toNodeList = function () {
		var list = [];
		this.itor().depthDown(function (node) {
			list.push(node);
		});
		return list;
	};
	
	/**
	 * 获取节点列表按照层级的分类
	 * key为层级，val为Ycc.Tree列表
	 * @return {{}}
	 */
	Ycc.Tree.prototype.getNodeListGroupByLayer = function () {
		var list = {};
		this.itor().depthDown(function (node,layer) {
			if(!list[layer])
				list[layer] = [];
			list[layer].push(node);
		});
		return list;
	};
	
	/**
	 * 获取节点的所有父级，靠近节点的父级排序在后
	 * @return {Ycc.Tree[]}
	 */
	Ycc.Tree.prototype.getParentList = function () {
		var node = this;
		var list = [];
		while(node.$parentID){
			var parent = nodeMap[node.$parentID];
			list.unshift(parent);
			node = parent;
		}
		return list;
	};
	
	/**
	 * 获取节点的所有兄弟节点，包括自身
	 * @return {Ycc.Tree[]}
	 */
	Ycc.Tree.prototype.getBrotherList = function () {
		var list = [];
		if(!this.$parentID)
			list = [this];
		else
			list = nodeMap[this.$parentID].children;
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