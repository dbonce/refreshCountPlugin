const { RawSource } = require("webpack-sources");

const MAX_FUN_NUM = 15;
const DEFAULT_MAX_FUN_NUM = 5;
const DEFAULT_TOAST = '更新次数';
const DEFAULT_TOAST_INTERVAL = 1000;
function refreshCountPlugin(injectedFunNames, options = {}) {
	this.injectedFunNames = injectedFunNames;
	this.toast = options.toast ? options.toast : DEFAULT_TOAST;
	this.maxFunNum = options.maxFunNum && options.maxFunNum < MAX_FUN_NUM ? options.maxFunNum : DEFAULT_MAX_FUN_NUM;
	this.toastInterval = options.toastInterval ? options.toastInterval : DEFAULT_TOAST_INTERVAL;
}
/*
function perfixTemp() {
	var countNum = 0;
	return function countAdd() {
		countNum += 1;
		return countNum;
	}
}
var perfixTempVal = perfixTemp();
var refreshCountTimeout = null;
var refreshCountLastNum = 0;
var refreshCountCurrNum = 0;
*/

/*
function count() {
	refreshCountCurrNum = perfixTempVal();
	if (!refreshCountTimeout) {
		refreshCountTimeout = setTimeout(() => {
			console.log('${this.toast}', refreshCountCurrNum - refreshCountLastNum);
			refreshCountLastNum = refreshCountCurrNum;
			clearTimeout(refreshCountTimeout);
			refreshCountTimeout = null
		}, ${this.toastInterval});
	}
}
count();
*/

refreshCountPlugin.prototype.apply = function(compiler) {
	if (this.injectedFunNames && this.injectedFunNames.length > this.maxFunNum) {
		console.error('注入的方法名已经超过最大方法数目限制');
		return;
	}
	compiler.plugin('emit', (compilation, callback) => {
		const outputfile = compilation.options.output.filename
		const assets = compilation.assets

		const asset = assets[outputfile]
		let content = asset.source()
		const countPrefix = `function perfixTemp() {
			\tvar countNum = 0;
			\treturn function countAdd() {
			\t\tcountNum += 1;
			\t\treturn countNum;
			\t}
			}
			var perfixTempVal = perfixTemp();
			var refreshCountTimeout = null;
			var refreshCountLastNum = 0;
			var refreshCountCurrNum = 0;
			\n`

		const countSuffix = `\nfunction count() {
			\trefreshCountCurrNum = perfixTempVal();
			\tif (!refreshCountTimeout) {
			\t\trefreshCountTimeout = setTimeout(() => {
			\t\t\tconsole.log('${this.toast}', refreshCountCurrNum - refreshCountLastNum);
			\t\t\trefreshCountLastNum = refreshCountCurrNum;
			\t\t\tclearTimeout(refreshCountTimeout);
			\t\t\trefreshCountTimeout = null
			\t\t}, ${this.toastInterval});
			\t}
			}
			count();
			\n
			`
		this.injectedFunNames.forEach(injectedFunName => {
			content = content.replace(`function ${injectedFunName}() {`, countPrefix + `function ${injectedFunName}() {` + countSuffix);
		})
		assets[outputfile] = new RawSource(content)

		callback()
	})
}

module.exports = refreshCountPlugin;
