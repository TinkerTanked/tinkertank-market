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
exports.id = "app/api/admin/analytics/student-counts/route";
exports.ids = ["app/api/admin/analytics/student-counts/route"];
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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_alien_Development_tinkertank_tinkertank_market_src_app_api_admin_analytics_student_counts_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/admin/analytics/student-counts/route.ts */ \"(rsc)/./src/app/api/admin/analytics/student-counts/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/analytics/student-counts/route\",\n        pathname: \"/api/admin/analytics/student-counts\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/analytics/student-counts/route\"\n    },\n    resolvedPagePath: \"/Users/alien/Development/tinkertank/tinkertank-market/src/app/api/admin/analytics/student-counts/route.ts\",\n    nextConfigOutput,\n    userland: _Users_alien_Development_tinkertank_tinkertank_market_src_app_api_admin_analytics_student_counts_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRmFuYWx5dGljcyUyRnN0dWRlbnQtY291bnRzJTJGcm91dGUmcGFnZT0lMkZhcGklMkZhZG1pbiUyRmFuYWx5dGljcyUyRnN0dWRlbnQtY291bnRzJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGYWRtaW4lMkZhbmFseXRpY3MlMkZzdHVkZW50LWNvdW50cyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmFsaWVuJTJGRGV2ZWxvcG1lbnQlMkZ0aW5rZXJ0YW5rJTJGdGlua2VydGFuay1tYXJrZXQlMkZzcmMlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGYWxpZW4lMkZEZXZlbG9wbWVudCUyRnRpbmtlcnRhbmslMkZ0aW5rZXJ0YW5rLW1hcmtldCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDeUQ7QUFDdEk7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9hbGllbi9EZXZlbG9wbWVudC90aW5rZXJ0YW5rL3RpbmtlcnRhbmstbWFya2V0L3NyYy9hcHAvYXBpL2FkbWluL2FuYWx5dGljcy9zdHVkZW50LWNvdW50cy9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYWRtaW4vYW5hbHl0aWNzL3N0dWRlbnQtY291bnRzL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYWRtaW4vYW5hbHl0aWNzL3N0dWRlbnQtY291bnRzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hZG1pbi9hbmFseXRpY3Mvc3R1ZGVudC1jb3VudHMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvYWxpZW4vRGV2ZWxvcG1lbnQvdGlua2VydGFuay90aW5rZXJ0YW5rLW1hcmtldC9zcmMvYXBwL2FwaS9hZG1pbi9hbmFseXRpY3Mvc3R1ZGVudC1jb3VudHMvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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

/***/ "(rsc)/./src/app/api/admin/analytics/student-counts/route.ts":
/*!*************************************************************!*\
  !*** ./src/app/api/admin/analytics/student-counts/route.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var _barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! __barrel_optimize__?names=addDays,endOfDay,format,startOfDay!=!date-fns */ \"(rsc)/./node_modules/date-fns/addDays.mjs\");\n/* harmony import */ var _barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=addDays,endOfDay,format,startOfDay!=!date-fns */ \"(rsc)/./node_modules/date-fns/startOfDay.mjs\");\n/* harmony import */ var _barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=addDays,endOfDay,format,startOfDay!=!date-fns */ \"(rsc)/./node_modules/date-fns/endOfDay.mjs\");\n/* harmony import */ var _barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=addDays,endOfDay,format,startOfDay!=!date-fns */ \"(rsc)/./node_modules/date-fns/format.mjs\");\n\n\n\nasync function GET() {\n    try {\n        const now = new Date();\n        const studentCountData = [];\n        // Get data for the next 7 days\n        for(let i = 0; i < 7; i++){\n            const date = (0,_barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_2__.addDays)(now, i);\n            const startDate = (0,_barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_3__.startOfDay)(date);\n            const endDate = (0,_barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_4__.endOfDay)(date);\n            // Get bookings for this day\n            const bookings = await _lib_prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.booking.findMany({\n                where: {\n                    startDate: {\n                        gte: startDate,\n                        lte: endDate\n                    },\n                    status: {\n                        in: [\n                            'CONFIRMED',\n                            'COMPLETED'\n                        ]\n                    }\n                },\n                include: {\n                    location: true\n                }\n            });\n            // Get total capacity (sum of all location capacities for simplicity)\n            const locations = await _lib_prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.location.findMany({\n                where: {\n                    isActive: true\n                }\n            });\n            const totalCapacity = locations.reduce((sum, location)=>sum + location.capacity, 0);\n            studentCountData.push({\n                date: (0,_barrel_optimize_names_addDays_endOfDay_format_startOfDay_date_fns__WEBPACK_IMPORTED_MODULE_5__.format)(date, 'yyyy-MM-dd'),\n                count: bookings.length,\n                capacity: totalCapacity\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(studentCountData);\n    } catch (error) {\n        console.error('Student count analytics API error:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to fetch student count data'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hZG1pbi9hbmFseXRpY3Mvc3R1ZGVudC1jb3VudHMvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUEyQztBQUNMO0FBQzJCO0FBRTFELGVBQWVNO0lBQ3BCLElBQUk7UUFDRixNQUFNQyxNQUFNLElBQUlDO1FBQ2hCLE1BQU1DLG1CQUFtQixFQUFFO1FBRTNCLCtCQUErQjtRQUMvQixJQUFLLElBQUlDLElBQUksR0FBR0EsSUFBSSxHQUFHQSxJQUFLO1lBQzFCLE1BQU1DLE9BQU9QLDJHQUFPQSxDQUFDRyxLQUFLRztZQUMxQixNQUFNRSxZQUFZViw4R0FBVUEsQ0FBQ1M7WUFDN0IsTUFBTUUsVUFBVVYsNEdBQVFBLENBQUNRO1lBRXpCLDRCQUE0QjtZQUM1QixNQUFNRyxXQUFXLE1BQU1iLCtDQUFNQSxDQUFDYyxPQUFPLENBQUNDLFFBQVEsQ0FBQztnQkFDN0NDLE9BQU87b0JBQ0xMLFdBQVc7d0JBQ1RNLEtBQUtOO3dCQUNMTyxLQUFLTjtvQkFDUDtvQkFDQU8sUUFBUTt3QkFDTkMsSUFBSTs0QkFBQzs0QkFBYTt5QkFBWTtvQkFDaEM7Z0JBQ0Y7Z0JBQ0FDLFNBQVM7b0JBQ1BDLFVBQVU7Z0JBQ1o7WUFDRjtZQUVBLHFFQUFxRTtZQUNyRSxNQUFNQyxZQUFZLE1BQU12QiwrQ0FBTUEsQ0FBQ3NCLFFBQVEsQ0FBQ1AsUUFBUSxDQUFDO2dCQUMvQ0MsT0FBTztvQkFDTFEsVUFBVTtnQkFDWjtZQUNGO1lBRUEsTUFBTUMsZ0JBQWdCRixVQUFVRyxNQUFNLENBQUMsQ0FBQ0MsS0FBS0wsV0FBYUssTUFBTUwsU0FBU00sUUFBUSxFQUFFO1lBRW5GcEIsaUJBQWlCcUIsSUFBSSxDQUFDO2dCQUNwQm5CLE1BQU1OLDBHQUFNQSxDQUFDTSxNQUFNO2dCQUNuQm9CLE9BQU9qQixTQUFTa0IsTUFBTTtnQkFDdEJILFVBQVVIO1lBQ1o7UUFDRjtRQUVBLE9BQU8xQixxREFBWUEsQ0FBQ2lDLElBQUksQ0FBQ3hCO0lBQzNCLEVBQUUsT0FBT3lCLE9BQU87UUFDZEMsUUFBUUQsS0FBSyxDQUFDLHNDQUFzQ0E7UUFDcEQsT0FBT2xDLHFEQUFZQSxDQUFDaUMsSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBcUMsR0FBRztZQUFFZCxRQUFRO1FBQUk7SUFDMUY7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL2FsaWVuL0RldmVsb3BtZW50L3RpbmtlcnRhbmsvdGlua2VydGFuay1tYXJrZXQvc3JjL2FwcC9hcGkvYWRtaW4vYW5hbHl0aWNzL3N0dWRlbnQtY291bnRzL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gJ0AvbGliL3ByaXNtYSc7XG5pbXBvcnQgeyBzdGFydE9mRGF5LCBlbmRPZkRheSwgYWRkRGF5cywgZm9ybWF0IH0gZnJvbSAnZGF0ZS1mbnMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKCkge1xuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3Qgc3R1ZGVudENvdW50RGF0YSA9IFtdO1xuXG4gICAgLy8gR2V0IGRhdGEgZm9yIHRoZSBuZXh0IDcgZGF5c1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICBjb25zdCBkYXRlID0gYWRkRGF5cyhub3csIGkpO1xuICAgICAgY29uc3Qgc3RhcnREYXRlID0gc3RhcnRPZkRheShkYXRlKTtcbiAgICAgIGNvbnN0IGVuZERhdGUgPSBlbmRPZkRheShkYXRlKTtcblxuICAgICAgLy8gR2V0IGJvb2tpbmdzIGZvciB0aGlzIGRheVxuICAgICAgY29uc3QgYm9va2luZ3MgPSBhd2FpdCBwcmlzbWEuYm9va2luZy5maW5kTWFueSh7XG4gICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgc3RhcnREYXRlOiB7XG4gICAgICAgICAgICBndGU6IHN0YXJ0RGF0ZSxcbiAgICAgICAgICAgIGx0ZTogZW5kRGF0ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgaW46IFsnQ09ORklSTUVEJywgJ0NPTVBMRVRFRCddLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgICBsb2NhdGlvbjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBHZXQgdG90YWwgY2FwYWNpdHkgKHN1bSBvZiBhbGwgbG9jYXRpb24gY2FwYWNpdGllcyBmb3Igc2ltcGxpY2l0eSlcbiAgICAgIGNvbnN0IGxvY2F0aW9ucyA9IGF3YWl0IHByaXNtYS5sb2NhdGlvbi5maW5kTWFueSh7XG4gICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgaXNBY3RpdmU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgdG90YWxDYXBhY2l0eSA9IGxvY2F0aW9ucy5yZWR1Y2UoKHN1bSwgbG9jYXRpb24pID0+IHN1bSArIGxvY2F0aW9uLmNhcGFjaXR5LCAwKTtcblxuICAgICAgc3R1ZGVudENvdW50RGF0YS5wdXNoKHtcbiAgICAgICAgZGF0ZTogZm9ybWF0KGRhdGUsICd5eXl5LU1NLWRkJyksXG4gICAgICAgIGNvdW50OiBib29raW5ncy5sZW5ndGgsXG4gICAgICAgIGNhcGFjaXR5OiB0b3RhbENhcGFjaXR5LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHN0dWRlbnRDb3VudERhdGEpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1N0dWRlbnQgY291bnQgYW5hbHl0aWNzIEFQSSBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gZmV0Y2ggc3R1ZGVudCBjb3VudCBkYXRhJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwicHJpc21hIiwic3RhcnRPZkRheSIsImVuZE9mRGF5IiwiYWRkRGF5cyIsImZvcm1hdCIsIkdFVCIsIm5vdyIsIkRhdGUiLCJzdHVkZW50Q291bnREYXRhIiwiaSIsImRhdGUiLCJzdGFydERhdGUiLCJlbmREYXRlIiwiYm9va2luZ3MiLCJib29raW5nIiwiZmluZE1hbnkiLCJ3aGVyZSIsImd0ZSIsImx0ZSIsInN0YXR1cyIsImluIiwiaW5jbHVkZSIsImxvY2F0aW9uIiwibG9jYXRpb25zIiwiaXNBY3RpdmUiLCJ0b3RhbENhcGFjaXR5IiwicmVkdWNlIiwic3VtIiwiY2FwYWNpdHkiLCJwdXNoIiwiY291bnQiLCJsZW5ndGgiLCJqc29uIiwiZXJyb3IiLCJjb25zb2xlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/admin/analytics/student-counts/route.ts\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/date-fns"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&page=%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fanalytics%2Fstudent-counts%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();