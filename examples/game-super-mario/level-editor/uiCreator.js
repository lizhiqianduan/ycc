/**
 * @file    uiCreator.js
 * @author  xiaohei
 * @date    2018/11/9
 * @description  uiCreator文件
 */


// 当前编辑器内UI的数目
var currentUIListLength = 0;

// 需要添加的ui顺序
var uiSequence = [
	// {name:'newGround',params:function(){ return [0,150,100]};}
];





function newMushroom(btn){
	
	var name = 'mushroom';
	var fnName = 'newMushroom';
	var propsDefault = {
		startX:0,
		marginBottom:200
	};
	
	// 禁用
	disableBtn(btn);
	// 显示属性更改区
	document.getElementById('props').style.display='block';
	document.getElementById(name+'-prop').style.display='block';
	
	// 重置属性
	for(var key in propsDefault){
		document.getElementById(name+'-prop-'+key).value=propsDefault[key];
	}
	
	var params = function () {
		// 场景图层的x坐标
		var layerX = parseInt(document.getElementById('layerX').value);
		
		// 取属性值
		for(var key in propsDefault){
			propsDefault[key] = parseInt(document.getElementById(name+'-prop-'+key).value);
		}
		
		// 返回
		return [propsDefault.startX+layerX,propsDefault.marginBottom];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}



function newMissile(btn){
	
	var name = 'missile';
	var fnName = 'newMissile';
	var propsDefault = {
		startX:0,
		marginBottom:200
	};
	
	// 禁用
	disableBtn(btn);
	// 显示属性更改区
	document.getElementById('props').style.display='block';
	document.getElementById(name+'-prop').style.display='block';
	
	// 重置属性
	for(var key in propsDefault){
		document.getElementById(name+'-prop-'+key).value=propsDefault[key];
	}
	
	var params = function () {
		// 场景图层的x坐标
		var layerX = parseInt(document.getElementById('layerX').value);
		
		// 取属性值
		for(var key in propsDefault){
			propsDefault[key] = parseInt(document.getElementById(name+'-prop-'+key).value);
		}
		
		// 返回
		return [propsDefault.startX+layerX,propsDefault.marginBottom];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}


function newGirl(btn){
	
	var name = 'girl';
	var fnName = 'newGirl';
	var propsDefault = {
		startX:0,
		marginBottom:200
	};
	
	// 禁用
	disableBtn(btn);
	// 显示属性更改区
	document.getElementById('props').style.display='block';
	document.getElementById(name+'-prop').style.display='block';
	
	// 重置属性
	for(var key in propsDefault){
		document.getElementById(name+'-prop-'+key).value=propsDefault[key];
	}
	
	var params = function () {
		// 场景图层的x坐标
		var layerX = parseInt(document.getElementById('layerX').value);
		
		// 取属性值
		for(var key in propsDefault){
			propsDefault[key] = parseInt(document.getElementById(name+'-prop-'+key).value);
		}
		
		// 返回
		return [propsDefault.startX+layerX,propsDefault.marginBottom];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}


/**
 * 新增金币点击事件
 */
function newCoin(btn){
	
	var name = 'coin';
	var fnName = 'newCoin';
	var propsDefault = {
		startX:0,
		height:200,
		row:1,
		col:3
	};
	
	// 禁用
	disableBtn(btn);
	// 显示属性更改区
	document.getElementById('props').style.display='block';
	document.getElementById(name+'-prop').style.display='block';
	
	// 重置属性
	for(var key in propsDefault){
		document.getElementById(name+'-prop-'+key).value=propsDefault[key];
	}
	
	var params = function () {
		// 场景图层的x坐标
		var layerX = parseInt(document.getElementById('layerX').value);
		
		// 取属性值
		for(var key in propsDefault){
			propsDefault[key] = parseInt(document.getElementById(name+'-prop-'+key).value);
		}
		
		// 返回
		return [propsDefault.startX+layerX,propsDefault.height,propsDefault.row,propsDefault.col];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}


/**
 * 工具面板点击事件
 */
function newWall(btn){
	
	var name = 'wall';
	var fnName = 'newWall';
	var propsDefault = {
		startX:0,
		marginBottom:200,
		row:1,
		col:3,
		special:'[]'
	};
	
	// 禁用
	disableBtn(btn);
	// 显示属性更改区
	document.getElementById('props').style.display='block';
	document.getElementById(name+'-prop').style.display='block';
	
	// 重置属性
	for(var key in propsDefault){
		document.getElementById(name+'-prop-'+key).value=propsDefault[key];
	}
	
	var params = function () {
		// 场景图层的x坐标
		var layerX = parseInt(document.getElementById('layerX').value);
		
		// 取属性值
		for(var key in propsDefault){
			propsDefault[key] = parseInt(document.getElementById(name+'-prop-'+key).value);
		}
		propsDefault.special = document.getElementById(name+'-prop-'+key).value;
		// 返回
		return [propsDefault.startX+layerX,propsDefault.marginBottom,propsDefault.row,propsDefault.col,JSON.parse(propsDefault.special)];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
	
}



/**
 * 地面新增事件
 */
function newGround(btn){
	
	var name = 'ground';
	var fnName = 'newGround';
	var propsDefault = {
		startX:0,
		height:200,
		width:300
	};
	
	// 禁用
	disableBtn(btn);
	// 显示属性更改区
	document.getElementById('props').style.display='block';
	document.getElementById(name+'-prop').style.display='block';
	
	// 重置属性
	for(var key in propsDefault){
		document.getElementById(name+'-prop-'+key).value=propsDefault[key];
	}
	
	var params = function () {
		// 场景图层的x坐标
		var layerX = parseInt(document.getElementById('layerX').value);
		
		// 取属性值
		for(var key in propsDefault){
			propsDefault[key] = parseInt(document.getElementById(name+'-prop-'+key).value);
		}

		// 返回
		return [propsDefault.startX+layerX,propsDefault.height,propsDefault.width];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}


/**
 * layerX的更改事件
 */
function onLayerXChange(){
	currentScene.layer.x = parseInt(document.getElementById('layerX').value);
}

/**
 * UI属性更新的函数
 */
function onPropChange() {
	clearAllUI();
	execUISequence();
}

/**
 * 执行ui的创建序列
 */
function execUISequence() {
	for(var i=0;i<uiSequence.length;i++){
		var uiCreator = uiSequence[i];
		var fnName = uiCreator.name;
		if(Ycc.utils.isFn(uiCreator.params))
			currentScene[fnName].apply(currentScene,uiCreator.params());
		if(Ycc.utils.isArray(uiCreator.params))
			currentScene[fnName].apply(currentScene,uiCreator.params);
	}
}

/**
 * 清除界面上绘制的UI
 */
function clearAllUI() {
	// 去除body引用
	Matter.Composite.allBodies(engine.world).forEach(function (body) {
		if(body._yccUI){
			body._yccUI._matterBody=null;
			body._yccUI=null;
		}
		Matter.World.remove(engine.world,body);
	});
	currentScene.layer.removeAllUI();
}

/**
 * 确认新增按钮的点击
 */
function sureOnclick() {
	var i;
	// UI属性全部隐藏
	document.getElementById('props').style.display='none';
	var uiPropItem = document.querySelectorAll('.tool-prop');
	for(i=0;i<uiPropItem.length;i++){
		uiPropItem[i].style.display='none';
	}
	
	// 按钮全部启用
	var btnItem = document.querySelectorAll('#tool-list button');
	for(i=0;i<btnItem.length;i++){
		btnItem[i].disabled=false;
		btnItem[i].removeAttribute('active');
	}
	
	// 固化最后一个UI的参数
	var lastProp = uiSequence[uiSequence.length-1];
	if(lastProp && Ycc.utils.isFn(lastProp.params))
		lastProp.params = lastProp.params();
	
}

function cancelOnclick() {
	// 按钮全部启用
	var btnItem = document.querySelectorAll('#tool-list button');
	for(i=0;i<btnItem.length;i++){
		btnItem[i].disabled=false;
		btnItem[i].removeAttribute('active');
	}
	
	// UI属性全部隐藏
	document.getElementById('props').style.display='none';
	var uiPropItem = document.querySelectorAll('tool-prop');
	for(i=0;i<uiPropItem.length;i++){
		uiPropItem[i].style.display='none';
	}

	// 弹出最后一个UI
	uiSequence.pop();
	clearAllUI();
	execUISequence();
	
	
}

/**
 * 禁用所有按钮，并给当前按钮添加active属性
 * @param btn
 */
function disableBtn(btn) {
	// removeAttribute('active')
	btn.setAttribute('active',1);
	// 按钮全部禁用
	var btnItem = document.querySelectorAll('#tool-list button');
	for(i=0;i<btnItem.length;i++){
		btnItem[i].disabled=true;
	}
}
