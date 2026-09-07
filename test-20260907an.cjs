// 回归测试：20260907an
// 验证：变美情报天气「省→市→区/县」三级级联 + 保存按钮 + change 委托真实生效
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const APP_JS = fs.readFileSync(path.join(ROOT, 'app.20260907an.js'), 'utf8');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const BUILD = '20260907an';
let fail = 0;
function ok(m){ console.log('✅', m); }
function no(m){ console.log('❌', m); fail++; }

// ── 版本一致性 ──
if (APP_JS.includes(`const APP_BUILD = '${BUILD}';`)) ok(`APP_BUILD = ${BUILD}`); else no('APP_BUILD 不一致');
if (VERSION.build === BUILD) ok(`version.json = ${BUILD}`); else no('version.json 不一致');
const swCache = SW.match(/CACHE = 'growtree-shell-v(\d+)'/);
if (swCache && parseInt(swCache[1],10) === 106) ok('SW CACHE 已递增到 v106'); else no('SW CACHE 未递增到 v106');
if (INDEX.includes('app.20260907an.js') && INDEX.includes('styles.20260907an.css')) ok('index.html 引用 an 文件'); else no('index.html 引用未更新');
if (SW.includes('./app.20260907an.js') && SW.includes('./styles.20260907an.css')) ok('sw.js SHELL 含 an 文件'); else no('sw.js SHELL 未更新');

// ── 三级级联 ──
if (APP_JS.includes('const BEAUTY_PROVINCE_CITIES')) ok('省份城市映射存在'); else no('缺少省份城市映射');
if (APP_JS.includes('id="beautyProvinceSelect"')) ok('UI 含省份下拉'); else no('缺少省份下拉');
if (APP_JS.includes('id="beautyCitySelect"')) ok('UI 含城市下拉'); else no('缺少城市下拉');
if (APP_JS.includes('id="beautyDistrictSelect"')) ok('UI 含区县下拉'); else no('缺少区县下拉');
if (APP_JS.includes('async function ensurePcas')) ok('存在 ensurePcas 区县数据懒加载'); else no('缺少 ensurePcas');
if (APP_JS.includes('unpkg.com/china-division/dist/pcas.json')) ok('区县数据走 unpkg CDN'); else no('区县数据 CDN 缺失');
if (APP_JS.includes('function findPcasProvince') && APP_JS.includes('function findPcasCity') && APP_JS.includes('function getCityAreaNames')) ok('省市区解析函数齐全'); else no('省市区解析函数缺失');
if (APP_JS.includes('function beautyOnProvinceChange') && APP_JS.includes('async function beautyOnCityChange') && APP_JS.includes('async function beautyFillDistrictOptions')) ok('级联 DOM 更新函数齐全'); else no('级联更新函数缺失');
if (/beautyCitySelect[^>]*\$\{pvSel \? '' : 'disabled'\}/.test(APP_JS) || APP_JS.includes("${pvSel ? '' : 'disabled'}")) ok('城市下拉在未选省份时禁用'); else no('城市下拉未做禁用联动');
if (APP_JS.includes('请先选择省份') && APP_JS.includes('请先选择城市')) ok('未选上级时的占位提示存在'); else no('占位提示缺失');

// ── 保存按钮 ──
if (APP_JS.includes('data-action="beauty-city-save"')) ok('UI 含「保存」按钮'); else no('缺少保存按钮');
if (APP_JS.includes("action === 'beauty-city-save'")) ok('handleAction 已注册保存事件'); else no('保存事件未注册');
if (APP_JS.includes('state.settings.district = finalDistrict')) ok('保存会写入区县'); else no('保存未写入区县');
if (APP_JS.includes("delete state.data.apiCache['beautyWeather']") && APP_JS.includes('loadBeautyWeather()')) ok('保存后清除缓存并刷新天气'); else no('保存未触发天气刷新');

// ── change 委托真实生效（关键回归：不能调用不存在的 handleAction） ──
if (APP_JS.includes("e.target.id === 'beautyProvinceSelect'") && APP_JS.includes('beautyOnProvinceChange()')) ok('省份下拉 change 委托 → beautyOnProvinceChange'); else no('省份 change 委托缺失');
if (APP_JS.includes("e.target.id === 'beautyCitySelect'") && APP_JS.includes('beautyOnCityChange()')) ok('城市下拉 change 委托 → beautyOnCityChange'); else no('城市 change 委托缺失');
if (!APP_JS.includes('handleAction(')) ok('已移除对不存在函数 handleAction 的调用'); else no('仍存在 handleAction 调用（该函数未定义，必然运行时报错）');

// ── 定位与坐标解析 ──
if (APP_JS.includes('function getGPSCoords')) ok('存在 getGPSCoords'); else no('缺少 getGPSCoords');
if (APP_JS.includes("data-action=\"beauty-city-locate\"")) ok('UI 含定位按钮'); else no('缺少定位按钮');
if (APP_JS.includes('async function geocodeAdmin') && APP_JS.includes('async function getLocationCoords')) ok('区县精度坐标解析函数存在'); else no('区县坐标解析函数缺失');
if (/getLocationCoords\(state\.settings\.province,\s*state\.settings\.city,\s*state\.settings\.district\)/.test(APP_JS)) ok('getBeautyPosition 按 省/市/区 解析坐标'); else no('getBeautyPosition 未接入区县解析');
if (APP_JS.includes("weather: 'https://api.open-meteo.com/v1'") && APP_JS.includes('${API.weather}/forecast')) ok('天气接口调用保留'); else no('天气接口调用缺失');

// ── 设置页兼容 ──
if (APP_JS.includes('prevCity') && APP_JS.includes("state.settings.district = ''")) ok('设置页改城市会清理旧区县'); else no('设置页未处理区县清理');

// ── 港澳台合规 ──
if (APP_JS.includes('中国台湾') && APP_JS.includes('中国香港') && APP_JS.includes('中国澳门')) ok('港澳台省份表述合规'); else no('港澳台省份表述需检查');

console.log('\n==== 结果：'+(fail===0?'全部通过 ✅':(fail+' 项失败 ❌'))+' ====');
process.exit(fail===0?0:1);
