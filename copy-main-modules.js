const fs = require('fs-extra');
const path = require('path');
const jsonfile = require('jsonfile');
const argv = require('yargs')
    .usage('Usage: $0 -d <dist>')
    .option('s', {
        alias: 'source',
        type: 'string',
        describe: 'The directory where dependencies is.',
    })
    .option('d', {
        alias: 'dist',
        type: 'string',
        describe: 'The directory where dependencies would be copies to.',
    })
    .option('r', {
        alias: 'dryrun',
        type: 'boolean',
        describe: 'Find the dependencies and log to the screen only.',
    })
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        describe: 'Enable verbose log.',
    })
    .parse();

const pkgfile = require('./package');

function getDependencies(allDependenciesDir, level, sourceDir, dependencies) {
    for (let i = 0; i < dependencies.length; i++) {
        let dependency = dependencies[i];
        let dependencyDir = path.join(sourceDir, dependency);

        if (!fs.existsSync(dependencyDir)) {
            throw new Error('Dependency "' + dependency + '" does not exist!');
        }

        let dependencyPackageFile = path.join(dependencyDir, 'package.json');

        if (!fs.existsSync(dependencyPackageFile)) {
            throw new Error('Dependency "' + dependency + '" package file does not exist!');
        }

        let dependencyPackage = jsonfile.readFileSync(dependencyPackageFile, { throws: false });

        if (!dependencyPackage) {
            throw new Error('Dependency "' + dependency + '" package file loads failed!');
        }

        if (argv.verbose) {
            let logPrefix = '';

            for (let i = 0; i < level * 2; i++) {
                logPrefix += '-';
            }

            console.log(logPrefix + (logPrefix && ' ') + 'find dependency ' + dependency);
        }

        if (dependencyPackage.dependencies) {
            let subDependenciesDir = [];
            let subDependencies = [];

            for (subDependency in dependencyPackage.dependencies) {
                if (!dependencyPackage.dependencies.hasOwnProperty(subDependency)) {
                    continue;
                }

                subDependencies.push(subDependency);
            }

            subDependenciesDir = getDependencies([], level + 1, sourceDir, subDependencies);
            allDependenciesDir.push(...subDependenciesDir);
        }

        allDependenciesDir.push(dependencyDir);
    }

    return allDependenciesDir;
}

function copyDependencies(dependenciesDir, dist) {
    let dependenciesDirSet = {};

    for (let i = 0; i < dependenciesDir.length; i++) {
        let dependencyDir = dependenciesDir[i];
        dependenciesDirSet[dependencyDir] = true;
    }

    for (let dependencyDir in dependenciesDirSet) {
        if (!dependenciesDirSet.hasOwnProperty(dependencyDir)) {
            continue;
        }

        let srcDir = path.join(__dirname, dependencyDir);
        let distDir = path.join(__dirname, dist, dependencyDir);

        if (!fs.existsSync(distDir)) {
            fs.mkdirpSync(distDir);
        }

        fs.copySync(srcDir, distDir);
    }
}

let dependencies = getDependencies([], 0, argv.source, pkgfile.mainDependencies);

if (!argv.dryrun) {
    copyDependencies(dependencies, argv.dist);
}
