// 回归测试：20260907am
// 验证：变美情报「看天穿衣/护肤」改为省份→城市二级级联选择，并增加定位按钮
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260907am.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260907am';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 105) ok('SW CACHE 已递增到 v105'); else no('SW CACHE 未递增到 v105');
if (INDEX.includes('app.20260907am.js') && INDEX.includes('styles.20260907am.css')) ok('index.html 引用 am 文件'); else no('index.html 引用未更新');
if (SW.includes('./app.20260907am.js') && SW.includes('./styles.20260907am.css')) ok('sw.js SHELL 含 am 文件'); else no('sw.js SHELL 未更新');

// ── 省份/城市二级选择 ──
if (APP_JS.includes('const BEAUTY_PROVINCE_CITIES')) ok('存在 BEAUTY_PROVINCE_CITIES 省份城市映射'); else no('缺少省份城市映射');
if (!APP_JS.includes('const BEAUTY_COMMON_CITIES')) ok('已移除长单城市列表'); else no('旧城市列表未移除');
if (APP_JS.includes('function beautyFindProvinceByCity')) ok('存在 beautyFindProvinceByCity 辅助函数'); else no('缺少城市反查省份函数');
if (APP_JS.includes('function beautyProvinceOptionsHTML')) ok('存在 beautyProvinceOptionsHTML'); else no('缺少省份选项渲染函数');
if (APP_JS.includes('function beautyCityOptionsHTML')) ok('存在 beautyCityOptionsHTML'); else no('缺少城市选项渲染函数');
if (APP_JS.includes('id="beautyProvinceSelect"')) ok('UI 含省份选择下拉框'); else no('缺少省份下拉框');
if (APP_JS.includes('id="beautyCitySelect"')) ok('UI 含城市选择下拉框'); else no('缺少城市下拉框');
if (APP_JS.includes("data-action=\"beauty-province-change\"")) ok('省份下拉绑定 change 事件'); else no('省份下拉未绑定事件');

// ── 定位按钮 ──
if (APP_JS.includes("data-action=\"beauty-city-locate\"")) ok('UI 含定位按钮'); else no('缺少定位按钮');
if (APP_JS.includes('function getGPSCoords')) ok('存在 getGPSCoords GPS 获取函数'); else no('缺少 GPS 获取函数');
if (APP_JS.includes("weatherMode === 'gps'")) ok('存在 GPS 天气模式'); else no('缺少 GPS 天气模式');
if (APP_JS.includes('state.settings.gpsCityName')) ok('GPS 位置名称可保存'); else no('未保存 GPS 位置名称');
if (APP_JS.includes("state.settings.weatherMode = 'gps'")) ok('点击定位会切换到 GPS 模式'); else no('定位未切换到 GPS 模式');

// ── 事件处理 ──
if (APP_JS.includes("action === 'beauty-province-change'")) ok('handleAction 已注册省份切换事件'); else no('省份切换事件未注册');
if (APP_JS.includes("action === 'beauty-city-change'")) ok('handleAction 已注册城市切换事件'); else no('城市切换事件未注册');
if (APP_JS.includes("action === 'beauty-city-confirm'")) ok('handleAction 已注册城市确认事件'); else no('城市确认事件未注册');
if (APP_JS.includes("action === 'beauty-city-locate'")) ok('handleAction 已注册定位事件'); else no('定位事件未注册');
if (APP_JS.includes("delete state.data.apiCache['beautyWeather']") && APP_JS.includes('loadBeautyWeather()')) ok('切换城市/定位后会清除天气缓存并重新加载'); else no('城市/定位切换未触发天气刷新');
if (APP_JS.includes('saveState()') && APP_JS.includes('queueSync')) ok('城市/定位变更会保存并同步到云端'); else no('城市/定位变更未保存/同步');

// ── 天气获取逻辑 ──
if (APP_JS.includes('function getBeautyPosition')) ok('存在 getBeautyPosition 函数'); else no('缺少 getBeautyPosition');
if (APP_JS.includes('function reverseGeocodeCity')) ok('存在 reverseGeocodeCity 反地理编码函数'); else no('缺少反地理编码函数');
if (APP_JS.includes("weather: 'https://api.open-meteo.com/v1'") && APP_JS.includes('${API.weather}/forecast')) ok('天气接口调用保留'); else no('天气接口调用缺失');

// ── 港澳台合规表述 ──
if (APP_JS.includes('中国台湾') && APP_JS.includes('中国香港') && APP_JS.includes('中国澳门')) ok('港澳台省份表述合规'); else no('港澳台省份表述需检查');

console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
process.exit(fail===0?0:1);
