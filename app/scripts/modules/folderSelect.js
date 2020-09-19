'use strict';
angular.module('folderSelectModule', [])

    .directive('folderSelect', function ($folderSelectService,$compile,$timeout) {
        return{
            restrict: 'E',
            replace: true,
            scope: {
                currentFolder: '=',
                currentName: '=',
                createFolder: '=',
                newFolderName: '=',
                ok: '='
            },
            template: `
<ul class="folder-select">
    <li class="folder-item" ng-class="{selected: item.path == currentFolder}" ng-repeat="item in Volumes track by $index">
        <div class="wrap-left">
            <span class="arrow icon" ng-class="item.open?'arrow-down':'arrow-right'" ng-click="selectedFolder($event,item,true)" ng-show="item.hasChild"></span>
        </div>
        <div class="wrap-right" ng-click="selectedFolder($event,item,false)">
            <div class="logo-wrap">
                <span class="logo icon" ng-class="item.name.toLowerCase()=='c:' ? 'system' : 'disk'"></span>
            </div>
            <span class="text" ng-style="{visibility:item.isEdit?'hidden':'visible'}">本地磁盘 ({{item.name}})</span>
            <input class="edit" type="text" ng-class="item.isEdit?'editing':''" ng-style="{display:item.isEdit?'block':'none'}" ng-value="item.name" ng-click="editClick($event)" ng-blur="changeFolderName($event, item)">
        </div>
        <ul class="folder-select" ng-style="{display: item.open?'block':'none'}"></ul>
    </li>
</ul>      
            `,
            link: function ($scope) {
                $scope.Volumes = $folderSelectService.getAllVolume();
                $scope.currentFolder = $scope.Volumes[0].path;
                $scope.currentName = $scope.Volumes[0].name;
                var currentNode = null;
                $timeout(function () {
                    currentNode = angular.element('li.folder-item').eq(0);
                })

                $scope.ok = function () {
                    $folderSelectService.ok($scope.currentName,$scope.currentFolder);
                    $scope.$emit('close');
                }

                $scope.selectedFolder = function (e,item,flag) {
                    var li = angular.element(e.target).parents('li.folder-item:first').eq(0);
                    if (!item.open && !item.openChild){
                        var childNode = li.find('ul.folder-select:first');
                        displayFolder(childNode,item);
                    }
                    item.open = flag ? (!item.open) : true;
                    if (!flag){
                        $scope.currentFolder = item.path;
                        $scope.currentName = item.name;
                        currentNode = li;
                    }
                    else {
                        var hasParent = $folderSelectService.hasParentNode(li, currentNode);
                        if (hasParent){
                            $scope.currentFolder = hasParent;
                            $scope.currentName = item.name;
                        }
                    }
                }

                $scope.createFolder = function () {
                    if ($scope.currentFolder == null) return;
                    var name = $folderSelectService.createFolder($scope.currentFolder, $scope.newFolderName);
                    var item = currentNode.scope().item;

                    var childNode = currentNode.find('ul.folder-select:first');
                    displayFolder(childNode,item);
                    item.open = true;
                    $scope.prevFolder = $scope.currentFolder;
                    $scope.currentFolder += name + '\\';
                    $scope.currentName = name;
                    $scope.oldFolder = $scope.currentFolder;
                    var content = angular.element('.content');
                    $timeout(function () {
                        currentNode = childNode.children('li.selected').eq(0);
                        var _scope = currentNode.scope();
                        var h = currentNode.offset().top - content.offset().top - content.height() + currentNode.height();
                        content.scrollTop(h);
                        _scope.item.isEdit = true;
                        $timeout(function () {
                            currentNode.find('.edit:first')[0].focus();
                            currentNode.find('.edit:first')[0].select();
                        },200)
                    })
                }

                $scope.editClick = function(e){
                    e.stopPropagation();
                }

                $scope.changeFolderName = function (e, item) {
                    item.isEdit = false;
                    var name = e.target.value;
                    var path = $scope.prevFolder + e.target.value + '\\';
                    item.name = $scope.currentName = name;
                    item.path = $scope.currentFolder = path;
                    $folderSelectService.renameFolder($scope.oldFolder, item.path);
                }

                function displayFolder(node,item) {
                    var scope = node.scope();
                    scope.childs = $folderSelectService.getAllFolder(item.path);
                    if (scope.childs.length == 0){
                        item.hasChild = false;
                        return;
                    }
                    var html = `
<li class="folder-item" ng-class="{selected: item.path == currentFolder}" ng-repeat="item in childs track by $index">
    <div class="wrap-left">
        <span class="arrow icon" ng-class="item.open?'arrow-down':'arrow-right'" ng-click="selectedFolder($event,item,true)" ng-show="item.hasChild"></span>
    </div>
    <div class="wrap-right" ng-click="selectedFolder($event,item,false)">
        <div class="logo-wrap">
            <span class="logo icon folder"></span>
        </div>    
        <span class="text" ng-style="{visibility:item.isEdit?'hidden':'visible'}">{{item.name}}</span>
        <input class="edit" type="text" ng-class="item.isEdit?'editing':''" ng-style="{display:item.isEdit?'block':'none'}" ng-value="item.name" ng-blur="changeFolderName($event, item)">
    </div>
    <ul class="folder-select" ng-style="{display: item.open?'block':'none'}"></ul>
</li>
                    `;
                    $(node).html($compile(html)(scope));
                    item.openChild = true;
                }
            }
        }
    })

    .filter('delLastChar', function () {
        return function (value) {
            if (value && value.endsWith('\\')){
                return value.substr(0, value.length - 1);
            }
            return value;
        }
    })

    .factory('$folderSelectService', function () {
        var electron = nodeRequire('electron');
        var ipcRenderer = electron.ipcRenderer;
        var remote = electron.remote;
        var execSync = remote.require('child_process').execSync;
        var fs = remote.require('fs');
        var nodePath = remote.require('path');
        var iconv = remote.require('iconv-lite');

        return{
            ok: function(name,folder){
                var path = fs.existsSync(name) ? name : folder;
                if (!path.endsWith('\\')){
                    path += '\\';
                }
                ipcRenderer.send('select-folder',path);
            },
            getAllVolume: function () {
                var stdout = execSync('wmic logicaldisk get caption');
                var list = stdout.toString().replace(/Caption|\s/g,'').split(':');
                list.pop();
                var data=[];
                for (var i = 0; i < list.length; i++){
                    var tmp = {
                        name: list[i] += ":",
                        path: list[i] += "\\",
                        open: false,
                        openChild: false,
                        hasChild: true,
                        isEdit:false
                    }
                    data.push(tmp)
                }
                return data;
            },
            getAllFolder: function (path) {
                var items = fs.readdirSync(path);
                var data=[];
                var arr = path.split(':\\');
                var stdout = execSync(`cd \\ && ${arr[0]}: && ${arr[1]!=''? `cd ${arr[1]} &&` : ''} dir /AD-H /D`);
                var out = iconv.decode(new Buffer(stdout, 'binary'), 'gb2312');
                for (var i = 0; i < items.length; i++) {
                    if (out.indexOf(`[${items[i]}]`) < 0)continue;
                    var p = nodePath.join(path,items[i]);
                    var tmp = {
                        name: items[i],
                        path: p + "\\",
                        open: false,
                        openChild: false,
                        hasChild: true,
                        isEdit:false
                    }
                    data.push(tmp);
                }
                return data;
            },
            hasParentNode: function (parentNode, childNode) {
                if (childNode == null){
                    return false;
                }
                var parent = parentNode.scope().item.path;
                var child = childNode.scope().item.path;
                if (parent == child || parent.length >= child.length || !child.startsWith(parent)){
                    return false;
                }
                var parentList =  childNode.parents('li.folder-item');
                var has = null;
                parentList.each(function () {
                    var _scope = angular.element(this).scope();
                    if (parent == _scope.item.path){
                        has = _scope.item.path
                        return false;
                    }
                })
                return has ? has : false;
            },
            createFolder: function (parent, name) {
                var path = parent + name;
                var newNum = 1;
                while (fs.existsSync(path)){
                    newNum++;
                    path = parent + (newNum > 1 ? `${name} (${newNum})` : name);
                }
                fs.mkdirSync(path);
                return (newNum > 1 ? `${name} (${newNum})` : name);
            },
            renameFolder: function (oldPath, newPath) {
                fs.renameSync(oldPath, newPath)
            }
        }
    })
