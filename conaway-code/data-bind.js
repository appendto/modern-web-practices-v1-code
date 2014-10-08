/* global document, _ */
(function initPage() {

    var scope = {
        newUser: {
            name: '',
            email: '',
            phone: '',
            selectValue: 1
        },
        output: document.getElementById('method-trigger-log'),
        dataBoundNodes: [],
        tempBindings: [],
        serverform: document.forms.serverMimicForm,
        logreset: document.getElementById('resetLog'),
        thisLog: '',
        prevLog: ''
    };

    /**
     * Retrieve all DOM nodes that have an attribute.
     */
    function getDataBindings (attr) {
        addLog('getDataBindings() was Triggered');
        scope.dataBoundNodes = document.querySelectorAll('['+ attr +']');

        checkBindings();

        if (scope.dataBoundNodes.length > 0) {
            return true;
        }

        return false;
    }

    function getTemplateBindings () {
        addLog('getTemplateBindings() was Triggered');
        scope.tempBindings = document.querySelectorAll('p, a, span');

        checkTemplates();

        if(scope.tempBindings.length > 0) {
            return true;
        }

        return false;
    }

    function checkTemplates () {
        addLog('checkTemplates() was Triggered');
        scope.tempBindings = _.chain(scope.tempBindings)
                            .filter(function (node) {
                                var hasTemplate,
                                    template = node.textContent;

                                if (/^<%=.*%>$/.test(template)) {
                                    node.classList.add('hidden');
                                    return true;
                                }
                            })
                            .value();
    }

    // Check to see if the prescribe data-bind'ings are valid
    // discard those that are not
    function checkBindings () {
        addLog('checkBindings() was Triggered');
        // if dataBoundNodes has elements in it, loop through each one and
        // see if there's a variable for it
        scope.dataBoundNodes = _.chain(scope.dataBoundNodes)
                            .filter(function (node) {
                                var found,
                                    path = node.attributes['data-bind'].value;

                                found = setGetObjPath(false, path);

                                return typeof found !== 'undefined';
                            })
                            .value();
    }

    // detect DOM event(s) and update the model's value
    function setDOMEventBindings () {
        addLog('setDOMEventBindings Triggered');
        _.forEach(scope.dataBoundNodes, function (item) {
            addKeyUpBinding(item);
            addChangeBinding(item);
            addInputBinding(item);
        });
    }

    /**
     * This method actually has 2 uses. 1) it checks for the existence of an object and/or path. 2) it can
     * set an object property value.
     * @param obj Object|False The object to use as a base
     * @param path string|Array The path, in array form or dot notation to search for
     * @param value Mixed Any value to pass into the Object property.
     */
    function setGetObjPath(obj, path, value) {
        addLog('setGetObjPath was Triggered');
        if (typeof path == 'string') {
            path = path.split('.');
            obj = obj || scope[path.splice(0, 1)];

            if (!obj) {
                return false;
            }
            return setGetObjPath(obj, path, value);
        } else if (path.length === 1 && value !== undefined) {
            obj[path[0]] = value;

            return obj;
        } else if (path.length === 0) {
            return obj;
        } else {
            return setGetObjPath(obj[path[0]],path.slice(1), value);
        }
    }

    function addKeyUpBinding (item) {
        item.addEventListener('keyup', function (event) {
            var node = event.target;
            var noAllow = [9,20,17,18,16,112,27];
            // as long as a relevent key was pressed update the linked object
            if (noAllow.indexOf(event.which) < 0) {
                //var path = node.attributes['data-bind'].value.split('.');
                //var obj = findObjectPath(path.splice(0, 1)[0]);
                var obj = setGetObjPath(false, node.attributes['data-bind'].value, item.value);
                // prove the values have been updated by showing them to the user
                displayObj(obj);
            }

        });
    }

    function addChangeBinding (item) {
        item.addEventListener('change', function (event) {
            var node = event.target;

            var obj = setGetObjPath(false, node.attributes['data-bind'].value, item.value);

            // prove the values have been updated by showing them to the user
            displayObj(obj);
        });
    }

    function addInputBinding (item) {
        item.addEventListener('input', function (event) {
            var node = event.target;

            var obj = setGetObjPath(false, node.attributes['data-bind'].value, item.value);

            // prove the values have been updated by showing them to the user
            displayObj(obj);
        });
    }

    /**
     * updateDom updates a 2-way binding field
     */
    function updateDom (isTemplate) {
        addLog('updateDom() was triggered');
        _.forEach(scope.dataBoundNodes, function (node) {
            //find the matching object and set the node value
            node.value = setGetObjPath(false, node.attributes['data-bind'].value);
        });
    }

    function loadServerData (e) {
        addLog('server data mimic triggered');
        e.preventDefault();
        var formFields = e.target;
        scope.newUser = {
            'name': formFields.name.value,
            'phone': formFields.phone.value,
            'email': formFields.email.value,
            'selectValue': formFields.selectValue.value
        };
        updateDom();
        displayObj();

        return false;
    }

    // just a method to show the changes on the page
    function displayObj () {
        addLog('displayObj() was Triggered');
        //addLog('displayObj Triggered');
        _.forEach(scope.tempBindings, function (node) {
            if (node.getAttribute('data-bind')) {
                node.textContent = setGetObjPath(false, node.attributes['data-bind'].value);
            } else {
                var binding = node.textContent.match(/^<%=(.*)%>$/)[1];

                node.setAttribute('data-bind', binding);
                node.textContent = setGetObjPath(false, binding);
                node.classList.remove('hidden');
            }
        });
    }

    function addLog(logMessage){
        scope.thisLog = logMessage;

        if(scope.thisLog === scope.prevLog) {
            var lastLogSpan = scope.output.lastChild.lastChild;
            var thisLogCount = Number(lastLogSpan.innerText);
            lastLogSpan.innerText++;
        } else {
            scope.thisLog += ' - ';
            var log = document.createTextNode(scope.thisLog);
            var logCount = document.createElement('span');
            var logTemplate = document.createElement('li');

            logCount.classList.add('log-count', 'red');
            logCount.textContent = '1';

            logTemplate.appendChild(log);
            logTemplate.appendChild(logCount);
            scope.output.appendChild(logTemplate);

            scope.thisLog = '';
            scope.prevLog = logMessage;
        }
    }

    function resetLog() {
        scope.output.innerHTML = '';
    }

    scope.serverform.onsubmit = loadServerData;
    scope.logreset.onclick = resetLog;

    if (getTemplateBindings()) {
        displayObj();
    }

    if (getDataBindings('data-bind')) {
        if (scope.dataBoundNodes.length > 0) {
            setDOMEventBindings();
            displayObj();
            updateDom();
        }
    }

})();
