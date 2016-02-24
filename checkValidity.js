/* 目前只支持text/password/url/email/number */

/* checkOpt
{
    errorMsgClass: "error",
    errorInputClass: "invalid",
    rule: "confirm-pwd": {
        check: handler.checkPwdIdentity,
        msg: "Passwords do not match"
    },
    errorText: {
        valueMissing: "Please fill out this field."
    },
    disableBrowserMsg: false
*/

var Form = function(form, checkOpt, submitCallback){
    this.addCheckValidity();
    this.form = form;
    form.Form = this;
    this.checkOpt = checkOpt;
    this.setValidationMsg(checkOpt);
    this.bindEvent();
    this.submitCallback = submitCallback;
    this.editingInput = null;
    this.removeMsgTimeId = 0;
};

Form.prototype.validationMessage_en = {
    email: 'invalid email format',
    number: 'invalid number format',
    url: 'invalid url format',
    password: 'invalid format',
    text: 'invalid format'
};

Form.prototype.validationMessage_cn = {
    email: '无效的邮箱格式',
    number: '无效的数字格式',
    url: '无效的网址格式',
    password: '格式无效',
    text: '格式无效'
};

Form.prototype.setValidationMsg = function(checkOpt){
    if(checkOpt.lang === "cn"){
        this.validationMessage = this.validationMessage_cn;
        if(!this.checkOpt.errorText){
            this.checkOpt.errorText = {};
        }
        if(!this.checkOpt.errorText.valueMissing){
            this.checkOpt.errorText.valueMissing = "请填写此项";
        }
    }
    else{
        this.validationMessage = Form.prototype.validationMessage_en;
        if(!this.checkOpt.errorText){ 
            this.checkOpt.errorText = {};
        }
        if(!this.checkOpt.errorText.valueMissing){
            this.checkOpt.errorText.valueMissing = "Please fill out this field";
        }
    }
};

Form.prototype.addCheckValidity = function(){
    var input = document.createElement("input");
    if(!input.checkValidity){
        HTMLInputElement.prototype.checkValidity = function(){
            var that = this;
            //添加checkValidity
            var m = {
                url : /^https?\:\/\/[a-z0-9]+/i,
                //date : /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/,
                email : /^[a-z0-9\.\'\-]+@[a-z0-9\.\-]+$/i,
                number : /^[0-9]+(\.[0-9]+)?$/i
            }
            // REQUIRED ATTRIBUTES
            var type  = that.getAttribute('t') || that.getAttribute("type"),
                required= (that.getAttribute('required') !== null),
                pattern = that.getAttribute('pattern');            
    
            this.validity = {
                valueMissing    : required && that.value.length===0,
                typeMismatch    : (that.value.length>0) && (type in m) && !that.value.match( m[type] ),
                patternMismatch : pattern && (that.value.length>0) && !that.value.match( new RegExp('^'+pattern+'$') )
            };
            var Form = that.form.Form;
            for(var x in that.validity){
                if(x === "valid" && that.validity[x] === true) return true;
                if(that.validity[x]){
                    that.validity.valid = false;
                    switch(x){
                        case "valueMissing":
                            that.validationMessage = Form.checkOpt.errorText.valueMissing;
                            break;
                        case "typeMismatch":
                            that.validationMessage = Form.validationMessage[type];
                        case "patternMismatch":
                            that.validationMessage = this.getAttribute("pm") || "type mismatch";
                    }
                    $(that).trigger('invalid');
                    return false;
                }
            }
            return that.validity.valid = true;
        };
        HTMLTextAreaElement.prototype.checkValidity = HTMLInputElement.prototype.checkValidity;
    }
    //form
    var form = document.createElement("form");
    if(!form.checkValidity){
        HTMLFormElement.prototype.checkValidity = function(){
            var $inputs = $(this).find("input, textarea");
            for(var i = 0; i < $inputs.length; i++){
                if(!$inputs[i].checkValidity()){
                    $(this).trigger("invalid");
                    return false;                    
                }
            }
            return true;
        }
    }
};

Form.prototype.addErrorMsg = function(input, msg, _maxWidth){
    var $input = $(input);
    var errorMsgClass = this.checkOpt.errorMsgClass;
    $input.addClass("invalid");
    var inputStyle = input.currentStyle ? input.currentStyle : document.defaultView.getComputedStyle(input, null);
    var halfWidth = $input.width()/2 + parseInt(inputStyle["paddingLeft"]);
    var maxWidth = _maxWidth ? _maxWidth : (halfWidth * 1.33 + 10 - 20);
    var style = "max-width:" + maxWidth + "px;box-sizing:content-box;";
    var position = $input.position();
    var marginLeft = parseInt(inputStyle["marginLeft"]);
    marginLeft = marginLeft ? marginLeft : 0;
    style += "left:" + (halfWidth*0.67 + position.left + marginLeft - 10) + "px;";
    var marginTop = parseInt(inputStyle["marginTop"]);
    marginTop = marginTop ? marginTop : 0;
    var paddingTop = parseInt(inputStyle["paddingTop"]);
    paddingTop = paddingTop ? paddingTop : 0;
    style += "top:" + (position.top + 0 + $input.height() + marginTop + paddingTop * 2) + "px";
    var errMsg = "<p class='" + errorMsgClass + "' style='" + style + "'><span style='max-width:" + (maxWidth - 25) + "px;'>" + msg + "</span></p>";
    $(input.form).find("." + this.checkOpt.errorMsgClass).remove();
    $(errMsg).insertAfter(input);
    clearTimeout(this.removeMsgTimeId);
    this.removeMsgTimeId = setTimeout(function(){
        $input.next("." + errorMsgClass).remove();
    }, 2000);
};

Form.prototype.customValidity = function(input){
   var rule = this.checkOpt.rule,
       name = input.name;
    if(rule && rule[name] && !rule[name]["async"]){
        if(!rule[name]["check"].call(input)){
            return rule[name]["msg"];
        }
    }
    return null;
};

Form.prototype.checkInputValidity = function(input){
    var errorText = input.form.Form.checkOpt.errorText;
    var text = "";
    if(!input.checkValidity()){
        var validity = input.validity;
        if(errorText && validity.valueMissing && (text = errorText.valueMissing)){
            return text;
        }
        else if(validity.patternMismatch && (text = input.getAttribute("pm"))){
            return text;
        }
        else if(validity.typeMismatch && (input.validationMessage === "type mismatch" || input.form.Form.checkOpt.disableBrowserMsg)){
            var defaultMsg = input.form.Form.validationMessage;
            var type  = input.getAttribute('t') || input.getAttribute("type");
            if(defaultMsg[type]){
                return defaultMsg[type];
            }
        }
        else{
            return input.validationMessage;
        }
    }
    else if(input.type === "textarea"){
        var pattern = input.getAttribute("pattern");
        if(pattern && (input.value.length>0) && !input.value.match( new RegExp('^'+pattern+'$') )){
            return input.getAttribute("pm");
        }
    }
    return this.customValidity(input);
}

Form.prototype.checkValidity = function(doesSubmit){
    var form = this.form;
    var Form = this;
    var $inputs = $(form).find("input, textarea");
    var rule = this.checkOpt.rule;
    for(var i = 0; i < $inputs.length; i++){
        if($inputs[i].hasCheck) continue;
        var msg = Form.checkInputValidity($inputs[i]);
        if(msg !== null){
            form.Form.addErrorMsg($inputs[i], msg);
            $inputs.eq(i).focus();
            return false;
        }
        var name = $inputs[i].name;
        if(rule && rule[name] && rule[name]["async"]){
            var autoFocus = true;
            Form.checkAsync($inputs[i], autoFocus, doesSubmit);
        } else {
            $inputs[i].hasCheck = true;
        }
    }
    var $submit = $(form).find("input[type=submit]");
    if($submit.length && doesSubmit){
        Form.tryCallSubmit($submit[0]);
    }
    return true;
}

Form.prototype.checkAsync = function(input, autoFocus, doesSubmit){
    name = input.name;
    var rule = input.form.Form.checkOpt.rule;
    rule[name]["check"].call(input, function(){
        var Form = input.form.Form;
        if(!autoFocus){
            Form.addErrorMsg(input, Form.checkOpt.rule[name].msg); 
        }
        if(autoFocus && !$(input.form).find("." + Form.checkOpt.errorMsgClass).length){
            Form.addErrorMsg(input, Form.checkOpt.rule[name].msg); 
            $(input).focus();
        }
    }, function(){
        input.hasCheck = true;
        if(doesSubmit){
            input.form.Form.tryCallSubmit(input);
        }
    });
};

Form.prototype.tryCallSubmit = function(input){
    var Form = this;
    if(typeof Form.submitCallback === "function" && Form.checkOK()){
        input.form.Form.submitCallback.call(input); 
        return true;
    }
    return false;
};

Form.prototype.checkOK = function(){
    var $inputs = $(this.form).find("input, textarea");
    for(var i = 0; i < $inputs.length; i++){
        if($inputs[i].type === "submit") continue;
        if(!$inputs[i].hasCheck) return false;
    }
    return true;
}

Form.prototype.bindEvent = function(){
    //关闭掉浏览器的默认行为，如input变红，弹提示框
    var $form = $(this.form);
    $form.on("invalid", "input, textarea", function(event){
        event.preventDefault();
    });
    $form.on("invalid", "form", function(event){
        event.preventDefault();
    });
    $form.on("blur", "input, textarea", function(event){
        event.preventDefault();
        var Form = this.form.Form;
        var msg = Form.checkInputValidity(this);
        if(msg !== null){
            Form.addErrorMsg(this, msg);
            return;
        }
        var rule = Form.checkOpt.rule;
        var name = this.name;
        if(rule && rule[name] && rule[name]["async"]){
            Form.checkAsync(this);    
        }  
        else{
            this.hasCheck = true;
        }
    });
    $form.on("click", "input[type=submit]", function(event){
        event.preventDefault();
        var Form = this.form.Form;
        $(Form.editingInput).blur();
        if(!Form.tryCallSubmit(this)){
            var doesSubmit = true;
            Form.checkValidity(doesSubmit);
        }
    });
    $form.on("focus", "input, textarea", function(){
        if(this.type !== "submit"){
            this.hasCheck = false;
        } 
        this.form.Form.editingInput = this;
        $(this).removeClass(this.form.Form.checkOpt.errorInputClass);
    });
};
