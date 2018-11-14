/**
 * @file    uiCreator.js
 * @author  xiaohei
 * @date    2018/11/9
 * @description  uiCreator文件
 */



// 需要添加的ui顺序
var uiSequence = [
	// {name:'newGround',params:function(){ return [0,150,100]};}
];

if(localStorage.getItem('uiSequence'))
	uiSequence = JSON.parse(localStorage.getItem('uiSequence'));



function newBucket(btn){
	var name = 'bucket';
	var fnName = 'newBucket';
	var propsDefault = {
		startX:0,
		marginBottom:150,
		direction:1,
		bucketWidth:80,
		bucketHeight:90
	};
	
	// 禁用
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.marginBottom,propsDefault.direction,propsDefault.bucketWidth,propsDefault.bucketHeight];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}


function newMushroom(btn){
	
	var name = 'mushroom';
	var fnName = 'newMushroom';
	var propsDefault = {
		startX:0,
		marginBottom:150
	};
	
	// 禁用
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.marginBottom];
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
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.marginBottom];
	};
	uiSequence.push({name:fnName,params:params});
	
	execUISequence();
}


function newGirl(btn){
	
	var name = 'girl';
	var fnName = 'newGirl';
	var propsDefault = {
		startX:0,
		marginBottom:150
	};
	
	// 禁用
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.marginBottom];
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
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.height,propsDefault.row,propsDefault.col];
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
		marginBottom:260,
		row:1,
		col:3,
		special:'[]'
	};
	
	// 禁用
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.marginBottom,propsDefault.row,propsDefault.col,JSON.parse(propsDefault.special)];
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
		height:150,
		width:300
	};
	
	// 禁用
	beforeSelectUI(btn);
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
		return [propsDefault.startX-layerX,propsDefault.height,propsDefault.width];
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
 * 执行ui的创建序列，并更改已添加的UI
 */
function execUISequence() {
	var liveUI = document.querySelector('#live-ui');
	// 已添加的UI是否为空
	var liveUIEmpty = true;
	liveUI.innerHTML='';
	for(var i=0;i<uiSequence.length;i++){
		var uiCreator = uiSequence[i];
		var fnName = uiCreator.name;
		if(Ycc.utils.isFn(uiCreator.params))
			currentScene[fnName].apply(currentScene,uiCreator.params());
		// 若params参数是数组，说明该UI已经被添加至舞台
		if(Ycc.utils.isArray(uiCreator.params)){
			liveUIEmpty = false;
			console.log(uiCreator,333);
			currentScene[fnName].apply(currentScene,uiCreator.params);
			liveUI.innerHTML+='<div class="clearfix">'+ fnName +' '+ JSON.stringify(uiCreator.params) +'<span onclick="deleteUI(\'' + encodeURI(JSON.stringify(uiCreator)) + '\')">点击删除</span></div>';
		}
	}
	if(liveUIEmpty){
		liveUI.innerHTML='空';
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
	// 存入localStorage，防止刷新页面丢失
	localStorage.setItem('uiSequence',JSON.stringify(uiSequence));
	clearAllUI();
	execUISequence();
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
	var uiPropItem = document.querySelectorAll('.tool-prop');
	for(i=0;i<uiPropItem.length;i++){
		uiPropItem[i].style.display='none';
	}

	// 弹出最后一个UI
	uiSequence.pop();
	clearAllUI();
	execUISequence();
	
	
}

/**
 * 所有UI的点击前的hook函数
 * 给当前按钮添加active属性，标识选中
 * @param btn
 */
function beforeSelectUI(btn) {
	var isActive = false;
	var btnItem = document.querySelectorAll('#tool-list button');
	for(i=0;i<btnItem.length;i++){
		if(parseInt(btnItem[i].getAttribute('active'))===1){
			isActive=true;
			break;
		}
	}
	// 如果存在已激活的按钮，说明之前正在编辑，取消编辑
	if(isActive){
		cancelOnclick();
	}

	btn.setAttribute('active',1);
	btn.disabled=true;
}

/**
 * 删除UI的点击事件
 * @param uiCreatorString
 */
function deleteUI(uiCreatorString) {
	uiCreatorString = decodeURI(uiCreatorString);
	console.log(uiCreatorString);
	for(var i=0;i<uiSequence.length;i++){
		var uiCreator = uiSequence[i];
		// 若params参数是数组，说明该UI已经被添加至舞台
		if(Ycc.utils.isArray(uiCreator.params)){
			if(uiCreatorString===JSON.stringify(uiCreator)){
				uiSequence.splice(i,1);
				clearAllUI();
				execUISequence();
				return;
			}
		}
	}
}

/**
 * 生成js文件
 */
function createJs(){
	var str = '';
	uiSequence.forEach(function (ui) {
		var temp = ui.params.map(function (param) {
			return JSON.stringify(param);
		});
		var item = 'this.'+ui.name+'('+temp.join(',')+');';
		str+=item;
	});
	console.log(str);
	// 创建js时删除存储
	localStorage.removeItem('uiSequence');
	document.getElementById('js').innerText=str;
}

/**
 * 开始调试
 */
function debugStart(btn){
	console.log(btn,333);
	var dom = document.getElementById('layerX');
	
	if(btn.innerText==='启动调试'){
		btn.innerText = '暂停调试';
		dom.disabled=true;
		ycc.ticker.addFrameListener(frameListener);
	}else{
		btn.innerText = '启动调试';
		dom.disabled=false;
		ycc.ticker.removeFrameListener(frameListener);
	}
}

/**
 * 调试时的每帧监听函数
 */
function frameListener() {
	var dom = document.getElementById('layerX');
	var layerX = parseInt(dom.value);
	layerX-=2;
	dom.value=layerX;
	onLayerXChange();
}


window.onerror = function (e) {
	alert(e);
};