/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/admin/analytics/revenue/route";
exports.ids = ["app/api/admin/analytics/revenue/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@prisma/client");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_alien_Development_tinkertank_tinkertank_market_src_app_api_admin_analytics_revenue_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/admin/analytics/revenue/route.ts */ \"(rsc)/./src/app/api/admin/analytics/revenue/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/analytics/revenue/route\",\n        pathname: \"/api/admin/analytics/revenue\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/analytics/revenue/route\"\n    },\n    resolvedPagePath: \"/Users/alien/Development/tinkertank/tinkertank-market/src/app/api/admin/analytics/revenue/route.ts\",\n    nextConfigOutput,\n    userland: _Users_alien_Development_tinkertank_tinkertank_market_src_app_api_admin_analytics_revenue_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRmFuYWx5dGljcyUyRnJldmVudWUlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmFkbWluJTJGYW5hbHl0aWNzJTJGcmV2ZW51ZSUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmFkbWluJTJGYW5hbHl0aWNzJTJGcmV2ZW51ZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmFsaWVuJTJGRGV2ZWxvcG1lbnQlMkZ0aW5rZXJ0YW5rJTJGdGlua2VydGFuay1tYXJrZXQlMkZzcmMlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGYWxpZW4lMkZEZXZlbG9wbWVudCUyRnRpbmtlcnRhbmslMkZ0aW5rZXJ0YW5rLW1hcmtldCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDa0Q7QUFDL0g7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9hbGllbi9EZXZlbG9wbWVudC90aW5rZXJ0YW5rL3RpbmtlcnRhbmstbWFya2V0L3NyYy9hcHAvYXBpL2FkbWluL2FuYWx5dGljcy9yZXZlbnVlL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hZG1pbi9hbmFseXRpY3MvcmV2ZW51ZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2FkbWluL2FuYWx5dGljcy9yZXZlbnVlXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hZG1pbi9hbmFseXRpY3MvcmV2ZW51ZS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9hbGllbi9EZXZlbG9wbWVudC90aW5rZXJ0YW5rL3RpbmtlcnRhbmstbWFya2V0L3NyYy9hcHAvYXBpL2FkbWluL2FuYWx5dGljcy9yZXZlbnVlL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/api/admin/analytics/revenue/route.ts":
/*!******************************************************!*\
  !*** ./src/app/api/admin/analytics/revenue/route.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var _barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! __barrel_optimize__?names=format,startOfDay,subDays!=!date-fns */ \"(rsc)/./node_modules/date-fns/subDays.mjs\");\n/* harmony import */ var _barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=format,startOfDay,subDays!=!date-fns */ \"(rsc)/./node_modules/date-fns/format.mjs\");\n/* harmony import */ var _barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=format,startOfDay,subDays!=!date-fns */ \"(rsc)/./node_modules/date-fns/startOfDay.mjs\");\n\n\n\nasync function GET(request) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const timeframe = searchParams.get('timeframe') || 'week';\n        const now = new Date();\n        let startDate;\n        let dateFormat;\n        let periods;\n        if (timeframe === 'month') {\n            startDate = (0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_2__.subDays)(now, 30);\n            dateFormat = 'MMM dd';\n            periods = 30;\n        } else {\n            startDate = (0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_2__.subDays)(now, 7);\n            dateFormat = 'EEE';\n            periods = 7;\n        }\n        const orders = await _lib_prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.order.findMany({\n            where: {\n                status: 'PAID',\n                createdAt: {\n                    gte: startDate,\n                    lte: now\n                }\n            },\n            orderBy: {\n                createdAt: 'asc'\n            }\n        });\n        // Group orders by date\n        const revenueByDate = {};\n        for(let i = 0; i < periods; i++){\n            const date = (0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_2__.subDays)(now, periods - 1 - i);\n            const dateKey = (0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_3__.format)((0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_4__.startOfDay)(date), 'yyyy-MM-dd');\n            revenueByDate[dateKey] = 0;\n        }\n        orders.forEach((order)=>{\n            const dateKey = (0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_3__.format)((0,_barrel_optimize_names_format_startOfDay_subDays_date_fns__WEBPACK_IMPORTED_MODULE_4__.startOfDay)(order.createdAt), 'yyyy-MM-dd');\n            if (revenueByDate.hasOwnProperty(dateKey)) {\n                revenueByDate[dateKey] += parseFloat(order.totalAmount.toString());\n            }\n        });\n        const revenueData = Object.entries(revenueByDate).map(([date, revenue])=>({\n                date,\n                revenue: Math.round(revenue * 100) / 100\n            }));\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(revenueData);\n    } catch (error) {\n        console.error('Revenue analytics API error:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to fetch revenue data'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hZG1pbi9hbmFseXRpY3MvcmV2ZW51ZS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBMkM7QUFDTDtBQUMyQjtBQUUxRCxlQUFlSyxJQUFJQyxPQUFnQjtJQUN4QyxJQUFJO1FBQ0YsTUFBTSxFQUFFQyxZQUFZLEVBQUUsR0FBRyxJQUFJQyxJQUFJRixRQUFRRyxHQUFHO1FBQzVDLE1BQU1DLFlBQVlILGFBQWFJLEdBQUcsQ0FBQyxnQkFBZ0I7UUFFbkQsTUFBTUMsTUFBTSxJQUFJQztRQUNoQixJQUFJQztRQUNKLElBQUlDO1FBQ0osSUFBSUM7UUFFSixJQUFJTixjQUFjLFNBQVM7WUFDekJJLFlBQVlYLGtHQUFPQSxDQUFDUyxLQUFLO1lBQ3pCRyxhQUFhO1lBQ2JDLFVBQVU7UUFDWixPQUFPO1lBQ0xGLFlBQVlYLGtHQUFPQSxDQUFDUyxLQUFLO1lBQ3pCRyxhQUFhO1lBQ2JDLFVBQVU7UUFDWjtRQUVBLE1BQU1DLFNBQVMsTUFBTWhCLCtDQUFNQSxDQUFDaUIsS0FBSyxDQUFDQyxRQUFRLENBQUM7WUFDekNDLE9BQU87Z0JBQ0xDLFFBQVE7Z0JBQ1JDLFdBQVc7b0JBQ1RDLEtBQUtUO29CQUNMVSxLQUFLWjtnQkFDUDtZQUNGO1lBQ0FhLFNBQVM7Z0JBQ1BILFdBQVc7WUFDYjtRQUNGO1FBRUEsdUJBQXVCO1FBQ3ZCLE1BQU1JLGdCQUEyQyxDQUFDO1FBRWxELElBQUssSUFBSUMsSUFBSSxHQUFHQSxJQUFJWCxTQUFTVyxJQUFLO1lBQ2hDLE1BQU1DLE9BQU96QixrR0FBT0EsQ0FBQ1MsS0FBS0ksVUFBVSxJQUFJVztZQUN4QyxNQUFNRSxVQUFVekIsaUdBQU1BLENBQUNGLHFHQUFVQSxDQUFDMEIsT0FBTztZQUN6Q0YsYUFBYSxDQUFDRyxRQUFRLEdBQUc7UUFDM0I7UUFFQVosT0FBT2EsT0FBTyxDQUFDLENBQUNaO1lBQ2QsTUFBTVcsVUFBVXpCLGlHQUFNQSxDQUFDRixxR0FBVUEsQ0FBQ2dCLE1BQU1JLFNBQVMsR0FBRztZQUNwRCxJQUFJSSxjQUFjSyxjQUFjLENBQUNGLFVBQVU7Z0JBQ3pDSCxhQUFhLENBQUNHLFFBQVEsSUFBSUcsV0FBV2QsTUFBTWUsV0FBVyxDQUFDQyxRQUFRO1lBQ2pFO1FBQ0Y7UUFFQSxNQUFNQyxjQUFjQyxPQUFPQyxPQUFPLENBQUNYLGVBQWVZLEdBQUcsQ0FBQyxDQUFDLENBQUNWLE1BQU1XLFFBQVEsR0FBTTtnQkFDMUVYO2dCQUNBVyxTQUFTQyxLQUFLQyxLQUFLLENBQUNGLFVBQVUsT0FBTztZQUN2QztRQUVBLE9BQU92QyxxREFBWUEsQ0FBQzBDLElBQUksQ0FBQ1A7SUFDM0IsRUFBRSxPQUFPUSxPQUFPO1FBQ2RDLFFBQVFELEtBQUssQ0FBQyxnQ0FBZ0NBO1FBQzlDLE9BQU8zQyxxREFBWUEsQ0FBQzBDLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQStCLEdBQUc7WUFBRXRCLFFBQVE7UUFBSTtJQUNwRjtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvYWxpZW4vRGV2ZWxvcG1lbnQvdGlua2VydGFuay90aW5rZXJ0YW5rLW1hcmtldC9zcmMvYXBwL2FwaS9hZG1pbi9hbmFseXRpY3MvcmV2ZW51ZS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcic7XG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tICdAL2xpYi9wcmlzbWEnO1xuaW1wb3J0IHsgc3RhcnRPZkRheSwgc3ViRGF5cywgc3ViV2Vla3MsIGZvcm1hdCB9IGZyb20gJ2RhdGUtZm5zJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICAgIGNvbnN0IHRpbWVmcmFtZSA9IHNlYXJjaFBhcmFtcy5nZXQoJ3RpbWVmcmFtZScpIHx8ICd3ZWVrJztcbiAgICBcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGxldCBzdGFydERhdGU6IERhdGU7XG4gICAgbGV0IGRhdGVGb3JtYXQ6IHN0cmluZztcbiAgICBsZXQgcGVyaW9kczogbnVtYmVyO1xuXG4gICAgaWYgKHRpbWVmcmFtZSA9PT0gJ21vbnRoJykge1xuICAgICAgc3RhcnREYXRlID0gc3ViRGF5cyhub3csIDMwKTtcbiAgICAgIGRhdGVGb3JtYXQgPSAnTU1NIGRkJztcbiAgICAgIHBlcmlvZHMgPSAzMDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnREYXRlID0gc3ViRGF5cyhub3csIDcpO1xuICAgICAgZGF0ZUZvcm1hdCA9ICdFRUUnO1xuICAgICAgcGVyaW9kcyA9IDc7XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXJzID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHN0YXR1czogJ1BBSUQnLFxuICAgICAgICBjcmVhdGVkQXQ6IHtcbiAgICAgICAgICBndGU6IHN0YXJ0RGF0ZSxcbiAgICAgICAgICBsdGU6IG5vdyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7XG4gICAgICAgIGNyZWF0ZWRBdDogJ2FzYycsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JvdXAgb3JkZXJzIGJ5IGRhdGVcbiAgICBjb25zdCByZXZlbnVlQnlEYXRlOiB7IFtrZXk6IHN0cmluZ106IG51bWJlciB9ID0ge307XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwZXJpb2RzOyBpKyspIHtcbiAgICAgIGNvbnN0IGRhdGUgPSBzdWJEYXlzKG5vdywgcGVyaW9kcyAtIDEgLSBpKTtcbiAgICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXQoc3RhcnRPZkRheShkYXRlKSwgJ3l5eXktTU0tZGQnKTtcbiAgICAgIHJldmVudWVCeURhdGVbZGF0ZUtleV0gPSAwO1xuICAgIH1cblxuICAgIG9yZGVycy5mb3JFYWNoKChvcmRlcikgPT4ge1xuICAgICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdChzdGFydE9mRGF5KG9yZGVyLmNyZWF0ZWRBdCksICd5eXl5LU1NLWRkJyk7XG4gICAgICBpZiAocmV2ZW51ZUJ5RGF0ZS5oYXNPd25Qcm9wZXJ0eShkYXRlS2V5KSkge1xuICAgICAgICByZXZlbnVlQnlEYXRlW2RhdGVLZXldICs9IHBhcnNlRmxvYXQob3JkZXIudG90YWxBbW91bnQudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCByZXZlbnVlRGF0YSA9IE9iamVjdC5lbnRyaWVzKHJldmVudWVCeURhdGUpLm1hcCgoW2RhdGUsIHJldmVudWVdKSA9PiAoe1xuICAgICAgZGF0ZSxcbiAgICAgIHJldmVudWU6IE1hdGgucm91bmQocmV2ZW51ZSAqIDEwMCkgLyAxMDAsIC8vIFJvdW5kIHRvIDIgZGVjaW1hbCBwbGFjZXNcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24ocmV2ZW51ZURhdGEpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1JldmVudWUgYW5hbHl0aWNzIEFQSSBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gZmV0Y2ggcmV2ZW51ZSBkYXRhJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwicHJpc21hIiwic3RhcnRPZkRheSIsInN1YkRheXMiLCJmb3JtYXQiLCJHRVQiLCJyZXF1ZXN0Iiwic2VhcmNoUGFyYW1zIiwiVVJMIiwidXJsIiwidGltZWZyYW1lIiwiZ2V0Iiwibm93IiwiRGF0ZSIsInN0YXJ0RGF0ZSIsImRhdGVGb3JtYXQiLCJwZXJpb2RzIiwib3JkZXJzIiwib3JkZXIiLCJmaW5kTWFueSIsIndoZXJlIiwic3RhdHVzIiwiY3JlYXRlZEF0IiwiZ3RlIiwibHRlIiwib3JkZXJCeSIsInJldmVudWVCeURhdGUiLCJpIiwiZGF0ZSIsImRhdGVLZXkiLCJmb3JFYWNoIiwiaGFzT3duUHJvcGVydHkiLCJwYXJzZUZsb2F0IiwidG90YWxBbW91bnQiLCJ0b1N0cmluZyIsInJldmVudWVEYXRhIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInJldmVudWUiLCJNYXRoIiwicm91bmQiLCJqc29uIiwiZXJyb3IiLCJjb25zb2xlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/admin/analytics/revenue/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log: [\n        'query',\n        'error'\n    ]\n});\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBOEM7QUFFOUMsTUFBTUMsa0JBQWtCQztBQUlqQixNQUFNQyxTQUNYRixnQkFBZ0JFLE1BQU0sSUFDdEIsSUFBSUgsd0RBQVlBLENBQUM7SUFDZkksS0FBSztRQUFDO1FBQVM7S0FBUTtBQUN6QixHQUFHO0FBRUwsSUFBSUMsSUFBcUMsRUFBRUosZ0JBQWdCRSxNQUFNLEdBQUdBIiwic291cmNlcyI6WyIvVXNlcnMvYWxpZW4vRGV2ZWxvcG1lbnQvdGlua2VydGFuay90aW5rZXJ0YW5rLW1hcmtldC9zcmMvbGliL3ByaXNtYS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5cbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7XG4gIHByaXNtYTogUHJpc21hQ2xpZW50IHwgdW5kZWZpbmVkO1xufTtcblxuZXhwb3J0IGNvbnN0IHByaXNtYSA9XG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPz9cbiAgbmV3IFByaXNtYUNsaWVudCh7XG4gICAgbG9nOiBbJ3F1ZXJ5JywgJ2Vycm9yJ10sXG4gIH0pO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYTtcbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwibG9nIiwicHJvY2VzcyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/date-fns"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Frevenue%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();