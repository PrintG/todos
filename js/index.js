/*==============================*/
//     * author -> Print        //
//     * QQ -> 2662256509       //
/*=============================*/
(function(){

	var _storage = window.localStorage;
	if(!_storage){
		Prop("您的浏览器不支持本地储存,程序无法运行,请升级或更换您的浏览器" , true).css({
			"height" : 250,
			"line-height" : "250px"
		});
		return;
	}

	var currentUser = null;	//当前登录的用户
	var _PrevTime = true; //限制弹窗速度

	var avoidLoginUser = getCookie("avoidLogin");
	if(avoidLoginUser){
		loginUser(avoidLoginUser);
		$(".login").hide();
		$(document.body).removeClass("loginBg");
		InitView();
	}else{
		login();
	}
	function login(){
		var $login = $(".login"),
			$input = $login.find(".input"),
			$inputs = $input.find("input"),
			$Tips = $input.find(".tip"),
			$avoidLogin = $login.find(".avoid-login");

		//免登陆选框点击事件
		$avoidLogin.click(function(){
			$(this).toggleClass("select");
		});

		//输入框失去焦点时让提示消失
		$inputs.on("blur", function(){
			var $this = $(this),
				$index = $this.parent().index() - 1;
			$this.val() !== ""?$Tips.eq($index).hide():$Tips.eq($index).show();
		});

		//禁止粘贴
		$inputs.on("keydown", function(e){
			if(e.keyCode === 86 && e.ctrlKey){
				e.preventDefault();
			};
		});

		//限制输入的值
		$inputs.on("keyup", function(e){
			var $this = $(this);

			var val = $this.val().match(/[0-9a-z_\u4e00-\u9fa5]/ig),
				str = "";

			if(!val){
				$this.val("");
				return;
			};

			var valL = val.length;
			for(var i = 0; i < valL; i++) str += val[i];
			$this.val(str);
		});

		//点击登录
		$inputs.eq(2).click(function(){
			var val1 = $inputs.eq(0).val(),
				val2 = $inputs.eq(1).val();

			//判断值是否存在,并且两个输入框的值相等
			if(val1 && val1 === val2){
				//判断用户名是否过长
				if(val1.length > 15){
					Prop("用户名过长！", true, true);
				}else{
					if($avoidLogin.hasClass("select")){
						setCookie({
							"avoidLogin" : val1
						}, 7);
					}
					loginUser(val1);
					$login.hide();
					$(document.body).removeClass("loginBg");
					$(this).off("click");
					InitView();
				}
			}else{
				Prop("用户名不一致", true, true);
			}
		});
	}

	/*=============== 生成初始界面 ===============*/
	function InitView(){
		var $main = $(".main"),
			$title = $main.find(".main-header .title"),
			$mainContent = $main.find(".main-content"),
			$addTask = $mainContent.find(".main-content-header .add-task"),
			$taskList = $mainContent.find(".task-list"),
			$noTask = $taskList.find(".no-task"),
			$taskProgress = $taskList.find(".task-progress"),
			$taskProgressMsg = $taskProgress.find(".task-name"),
			$clearCompleted = $taskProgress.find(".task-delete"),
			$taskProgressBar = $mainContent.find(".task-progress-bar"),
			$addTaskPropWin =  $(".propWin-add-task"),
			$addTaskPropWinInput = $addTaskPropWin.find(".wrap input"),
			$addTaskPropWinClose = $addTaskPropWin.find(".close");


		//初始生成一遍
		(function(){
			var _Fragment = $(document.createDocumentFragment());
			operUserMsg({
				userName : currentUser,
				type : {
					each : function(i,v){
						_Fragment.prepend(createTaskLi(v.taskname,v.completed));
					}
				}
			});
			$taskList.prepend(_Fragment);
		})();

		updateTask();
		$main.removeClass("hide");
		$title.html("<span>"+currentUser+"</span>的待办项列表<a href=\"javascript:;\" class=\"logout\">注销登陆</a>");
		$title.find(".logout").click(function(){
			removeCookie("avoidLogin");
			location.reload(true);
		});

		//点击弹出添加待办项窗口
		$addTask.click(function(){
			$addTaskPropWin.fadeIn(500);
		});
		//点击添加待办项
		$addTaskPropWinInput.eq(1).click(function(){
			var taskName = $addTaskPropWinInput.eq(0).val();

			//检测值是否合法
			if(taskName === "" || /\s/g.test(taskName)){
				Prop("请输入合法值(不能包含空格)", true, true);
				return;
			}

			var _isRepeat = addTask(currentUser, taskName);

			updateTask();

			if(_isRepeat){
				return;
			};

			$taskList.prepend(createTaskLi(taskName,"false"));

			$addTaskPropWin.fadeOut(500);
			$addTaskPropWinInput.eq(0).val("");
		});

		//清空已完成
		$clearCompleted.click(function(){
			$taskList.find(".task-item.completed").each(function(i, v){
				var $taskName = $(v).remove().find(".task-name").text();
				deleteTask(currentUser, $taskName);
			});
			updateTask();
		});

		//关闭窗口
		$addTaskPropWinClose.click(function(){
			$addTaskPropWin.fadeOut(500);
			$addTaskPropWinInput.eq(0).val("");
		});

		//创建待办项容器
		function createTaskLi(taskName,taskCompleted){
			var oLi = document.createElement("li");
			oLi.className = "task-item"+(taskCompleted==="true"?" completed":"");
			oLi.innerHTML = "<i class=\"iconfont icon-dui task-select\"></i>"+
							"<p class=\"task-name\">"+taskName+"</p>"+
							"<a href=\"javascript:;\" class=\"task-delete\">删除</a>";
			$(oLi).find(".task-select,.task-name").click(setCompleted);
			$(oLi).find(".task-delete").click(setTaskDelete);
			return oLi;
		}

		//点击划掉/恢复待办项事件
		function setCompleted(){
			var $tParent = $(this).parent(),
				taskName = $tParent.find(".task-name").text();

			$tParent.toggleClass("completed");
			deleteTask(currentUser, taskName)
			addTask(currentUser, taskName, $tParent.hasClass("completed")?"true":false);

			updateTask();
		}
		//点击删除待办项事件
		function setTaskDelete(){
			var $tParent = $(this).parent(),
				$taskName = $tParent.find(".task-name").text();
			deleteTask(currentUser, $taskName);
			$tParent.remove();
			updateTask();
		}

		//更新任务进度等
		function updateTask(){
			var taskList = operUserMsg({userName : currentUser,type : "get"});
			if(taskList.length === 0){
				$noTask.show();
				$taskProgress.addClass("hide");
				$taskProgressBar.width("0%");
			}else{	
				$noTask.hide();
				$taskProgress.removeClass("hide");
				//更新进度条进度
				var taskData = operUserMsg({userName:currentUser,type:"get"}),
					taskDataLength = taskData.length;
				var completedNum = 0;	//已完成的个数

				for(var i = 0; i < taskDataLength; i++){
					if(taskData[i].completed === "true"){
						completedNum += 1;
					}
				}

				var prop = (completedNum/taskDataLength*100).toFixed(2);
				$taskProgressMsg.text("任务进度： "+completedNum+"/"+taskDataLength+" ("+prop+"%)");
				$taskProgressBar.width(prop+"%");

			}
		}
	}
	//=========================== 获取/设置 用户待办项 ===========================//
	/*
		obj对象属性:
			userName -> string -> 要管理的用户名
			type     -> object -> 要操作的类型
				get      -> string -> 返回用户的待办项列表
				findUser -> string -> 返回用户是否存在
				object   -> object -> 返回用户的某个代表项是否存在
					taskname -> string   -> 待办项名 
					each(可选)     -> function -> 遍历用户的代办列表, 值传入形参
	*/
	function operUserMsg(obj){
		if(!obj || !obj.userName || !obj.type ){
			return;
		}
		var userName = obj.userName,	//用户名
			type = obj.type,	//操作类型
			userData = _storage.todos,	//todos对象字符串
			current;	//当前用户的待办列表

		//判断todos是否存在
		if(!userData){
			return null;
		}
		//把对象字符串转为对象
		userData = JSON.parse(userData);
		current = userData[userName];

		//用户不存在则退出函数
		if(!current){
			return;
		}

		if(type === "get"){
			//返回待办项列表
			return current;
		}else if(type === "findUser"){
			//返回用户是否存在
			return !!current;
		}else if(typeof type === "object"){
			//查找指定的待办项
			var curentL = current.length,
				findV = null;
			for(var i = 0; i < curentL; i++){
				type.each && type.each(i,current[i]);
				if(current[i].taskname === type.taskname){
					findV = type.taskname;
				}
			}
			return findV;
		}
	}
	//为某个用户添加待办项, 返回一个值表示是否重复
	//userName -> 用户名   taskName -> 待办项名
	function addTask(userName, taskName, isCompleted){
		var todos = _storage.todos;

		isCompleted = isCompleted?"true":"false";
		
		//todos不存在则退出函数
		if(!todos) return;

		var data = JSON.parse(todos),
			currentUserData = data[userName];

		//如果用户不存在
		if(!currentUserData) return;

		//检测是否重复
		var isRepeat = operUserMsg({
			userName : userName,
			type : {
				taskname : taskName
			}	
		});
		if(isRepeat){
			Prop("代办项重复！请重新添加",true,true);
			return true;
		}

		//把待办项添加至本地储存
		currentUserData.push({
			"taskname" : taskName,
			"completed" : isCompleted
		});

		data[userName] = currentUserData;

		_storage.setItem("todos", JSON.stringify(data));
	}
	//为某个用户删除待办项
	//userName -> 用户名   taskName -> 待办项名
	function deleteTask(userName, taskName){
		var todos = _storage.todos;
		//todos不存在则退出函数
		if(!todos) return;
		var data = JSON.parse(todos),
			currentUserData = data[userName];

		//遍历删除
		operUserMsg({
			userName : userName,
			type : {
				each : function(i,v){
					if(v.taskname === taskName){
						currentUserData.splice(i,1);
					}
				}
			}
		});
		data[userName] = currentUserData;
		_storage.todos = JSON.stringify(data);
	}
	/*
		储存格式:
			todos : {
				userName : [
					{
						"taskname" : "任务名",
						"completed" : "是否完成"
					}
					...
				]
				...
			}
	*/

	/*=============== 对本地储存的操作 ===============*/
	/*
	*	登录
	*	userName -> 用户名
	*/
	function loginUser(userName){
		//如果todos对象不存在,则创建一个
		if(_storage.getItem("todos") === null){
			_storage.setItem("todos", "{}");
		}

		var todos = JSON.parse(localStorage.getItem("todos"));
		Prop("登入成功", true, true);

		//当前登录的用户为该用户
		currentUser = userName;

		//判断用户是否存在
		if(operUserMsg({"userName" : userName,"type" : "findUser"})){
			return
		}
		//不存在则重新创建一个
		todos[userName] = [];
		//添加至本地储存
		_storage.setItem("todos", JSON.stringify(todos));
	}

	/*=============== 弹窗操作 ===============*/
	/*
	* bool ->  显示/隐藏 弹窗(boolean)
	* isInOut -> 是否显示1s后消失
	*/
	function Prop(content , bool, isInOut){
		if(_PrevTime === true || new Date() - _PrevTime > 1000){
			var $propWin = $(".propWin");
			$propWin.text(content);
			bool?$propWin.fadeIn(500):$propWin.fadeOut(500);
			if(isInOut){
				$propWin.delay(500).fadeOut(500);
			}
			_PrevTime = new Date();
		}
		return $propWin;
	}

	/*=============== 操作Cookie方法 ===============*/
    function getCookie(key) {
        var val = document.cookie.match(new RegExp("\\b"+key+"=([^;]*)(;|$)"));
        return val?val[1]:null;
    }

    function setCookie(mJson , time) {
        var data = new Date( new Date().getTime() + time*24*60*60*1000 ).toGMTString();
        for (var key in mJson) document.cookie = key+"="+mJson[key]+"; expires="+data;
    }

    function removeCookie(key) {
        var json = {};json[key] = "";
        setCookie(json,-1);
    }
})();