// 回归测试：20260907al
// 验证：变美情报「看天穿衣/护肤」增加可选择城市并联网同步天气
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260907al.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260907al';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 104) ok('SW CACHE 已递增到 v104'); else no('SW CACHE 未递增到 v104');
if (INDEX.includes('app.20260907al.js') && INDEX.includes('styles.20260907al.css')) ok('index.html 引用 al 文件'); else no('index.html 引用未更新');
if (SW.includes('./app.20260907al.js') && SW.includes('./styles.20260907al.css')) ok('sw.js SHELL 含 al 文件'); else no('sw.js SHELL 未更新');

// ── 变美情报城市选择功能 ──
if (APP_JS.includes('const BEAUTY_COMMON_CITIES')) ok('存在常用城市列表常量'); else no('缺少常用城市列表');
if (APP_JS.includes('function getCityCoordinates')) ok('存在 getCityCoordinates 地理编码函数'); else no('缺少地理编码函数');
if (APP_JS.includes('geocoding-api.open-meteo.com/v1/search')) ok('使用 open-meteo 地理编码接口解析城市'); else no('未使用地理编码接口');
if (APP_JS.includes("data-action=\"beauty-city-change\"")) ok('UI 含城市选择下拉框'); else no('缺少城市选择下拉框');
if (APP_JS.includes("data-action=\"beauty-city-confirm\"")) ok('UI 含城市确认按钮'); else no('缺少城市确认按钮');
if (APP_JS.includes("id=\"beautyCityInput\"")) ok('UI 含自定义城市输入框'); else no('缺少自定义城市输入框');

// ── 事件处理 ──
if (APP_JS.includes("action === 'beauty-city-change'") && APP_JS.includes("action === 'beauty-city-confirm'")) ok('handleAction 已注册城市切换/确认事件'); else no('handleAction 未注册城市事件');
if (APP_JS.includes('state.settings.city') && APP_JS.includes("delete state.data.apiCache['beautyWeather']") && APP_JS.includes('loadBeautyWeather()')) ok('切换城市后会清除天气缓存并重新加载'); else no('城市切换未触发天气刷新');
if (APP_JS.includes('saveState()') && APP_JS.includes('queueSync')) ok('城市变更会保存并同步到云端'); else no('城市变更未保存/同步');

// ── 天气获取逻辑 ──
if (APP_JS.includes('function getBeautyPosition')) ok('存在 getBeautyPosition 函数'); else no('缺少 getBeautyPosition');
if (/async\s+function\s+getCityCoordinates/.test(APP_JS) || /getCityCoordinates\s*\(\s*city\s*\)/.test(APP_JS)) ok('getCityCoordinates 支持异步解析'); else no('getCityCoordinates 异步解析异常');
if (APP_JS.includes("weather: 'https://api.open-meteo.com/v1'") && APP_JS.includes('${API.weather}/forecast')) ok('天气接口调用保留'); else no('天气接口调用缺失');

// ── 其他地区城市合规表述 ──
if (APP_JS.includes('台北（中国台湾）') && APP_JS.includes('中国澳门')) ok('港澳台城市表述合规'); else no('港澳台城市表述需检查');

console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
process.exit(fail===0?0:1);
