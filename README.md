# Node Http Git Server
#### Simple git server via Http protocol

[Development Note](https://hackmd.io/JwJghmDGUKwLSQCwAYCmdEwCYDM4A4RUA2OMAI0QEYBmEc5c8rcoA===#)

## Depencency
- NodeJS >= v4.2.6
- git

## Install
```
$ npm install
```
## Run
```
$ node app.js
```
or
```
$ npm start
```
## Configure
1. Open "config.json", set "root" to the path which is the root of all the repositories

## Misc
- To set up a repository, you can do these commands:
```
cd [your-root-path]
mkdir [repository-name]
cd [repository-name]
git init --bare
```
    * [your-root-path] and [repository-name] aren't command, you have to define your own name.
