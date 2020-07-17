'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

let getFullPath = function (dir, fileName) {
    return path.join(dir, fileName);
};

let isExists = function (fullPath) {
    return fs.existsSync(fullPath);
};

let writeFile = function(file,data){
    return new Promise(function (resolve, reject) {
        fs.writeFile(file,data,function () {
            resolve();
        })
    })
}

let writeFileSync = function(file,data){
    fs.writeFileSync(file,data);
}

let getBigVolume = function(){
    var stdout = execSync('wmic logicaldisk get caption && wmic logicaldisk get freespace');
    var arr = stdout.toString().split('FreeSpace');
    var list = arr[0].replace(/Caption|\s/g,'').split(':');
    list.pop();

    var size = arr[1].match(/\d{1,100}/g);

    var num = null;
    var index = null;
    for(var i=0;i<size.length;i++){
        if(num==null || size[i]>num){
            num = size[i];
            index = i;
        }
    }

    return list[index]+':\\';
}

module.exports = {
    getFullPath: getFullPath,
    isExists: isExists,
    writeFile: writeFile,
    writeFileSync: writeFileSync,
    getBigVolume: getBigVolume
};
