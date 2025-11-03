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
exports.id = "app/api/admin/bookings/recent/route";
exports.ids = ["app/api/admin/bookings/recent/route"];
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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&page=%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&page=%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_alien_Development_tinkertank_tinkertank_market_src_app_api_admin_bookings_recent_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/admin/bookings/recent/route.ts */ \"(rsc)/./src/app/api/admin/bookings/recent/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/bookings/recent/route\",\n        pathname: \"/api/admin/bookings/recent\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/bookings/recent/route\"\n    },\n    resolvedPagePath: \"/Users/alien/Development/tinkertank/tinkertank-market/src/app/api/admin/bookings/recent/route.ts\",\n    nextConfigOutput,\n    userland: _Users_alien_Development_tinkertank_tinkertank_market_src_app_api_admin_bookings_recent_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRmJvb2tpbmdzJTJGcmVjZW50JTJGcm91dGUmcGFnZT0lMkZhcGklMkZhZG1pbiUyRmJvb2tpbmdzJTJGcmVjZW50JTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGYWRtaW4lMkZib29raW5ncyUyRnJlY2VudCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmFsaWVuJTJGRGV2ZWxvcG1lbnQlMkZ0aW5rZXJ0YW5rJTJGdGlua2VydGFuay1tYXJrZXQlMkZzcmMlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGYWxpZW4lMkZEZXZlbG9wbWVudCUyRnRpbmtlcnRhbmslMkZ0aW5rZXJ0YW5rLW1hcmtldCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDZ0Q7QUFDN0g7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9hbGllbi9EZXZlbG9wbWVudC90aW5rZXJ0YW5rL3RpbmtlcnRhbmstbWFya2V0L3NyYy9hcHAvYXBpL2FkbWluL2Jvb2tpbmdzL3JlY2VudC9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYWRtaW4vYm9va2luZ3MvcmVjZW50L3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYWRtaW4vYm9va2luZ3MvcmVjZW50XCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hZG1pbi9ib29raW5ncy9yZWNlbnQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvYWxpZW4vRGV2ZWxvcG1lbnQvdGlua2VydGFuay90aW5rZXJ0YW5rLW1hcmtldC9zcmMvYXBwL2FwaS9hZG1pbi9ib29raW5ncy9yZWNlbnQvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&page=%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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

/***/ "(rsc)/./src/app/api/admin/bookings/recent/route.ts":
/*!****************************************************!*\
  !*** ./src/app/api/admin/bookings/recent/route.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\nasync function GET() {\n    try {\n        const recentBookings = await _lib_prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.booking.findMany({\n            take: 10,\n            orderBy: {\n                createdAt: 'desc'\n            },\n            include: {\n                student: {\n                    select: {\n                        name: true\n                    }\n                },\n                product: {\n                    select: {\n                        name: true\n                    }\n                },\n                location: {\n                    select: {\n                        name: true\n                    }\n                }\n            }\n        });\n        const formattedBookings = recentBookings.map((booking)=>({\n                id: booking.id,\n                student: booking.student,\n                product: booking.product,\n                location: booking.location,\n                startDate: booking.startDate.toISOString(),\n                status: booking.status,\n                totalPrice: parseFloat(booking.totalPrice.toString())\n            }));\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(formattedBookings);\n    } catch (error) {\n        console.error('Recent bookings API error:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to fetch recent bookings'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hZG1pbi9ib29raW5ncy9yZWNlbnQvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTJDO0FBQ0w7QUFFL0IsZUFBZUU7SUFDcEIsSUFBSTtRQUNGLE1BQU1DLGlCQUFpQixNQUFNRiwrQ0FBTUEsQ0FBQ0csT0FBTyxDQUFDQyxRQUFRLENBQUM7WUFDbkRDLE1BQU07WUFDTkMsU0FBUztnQkFDUEMsV0FBVztZQUNiO1lBQ0FDLFNBQVM7Z0JBQ1BDLFNBQVM7b0JBQ1BDLFFBQVE7d0JBQ05DLE1BQU07b0JBQ1I7Z0JBQ0Y7Z0JBQ0FDLFNBQVM7b0JBQ1BGLFFBQVE7d0JBQ05DLE1BQU07b0JBQ1I7Z0JBQ0Y7Z0JBQ0FFLFVBQVU7b0JBQ1JILFFBQVE7d0JBQ05DLE1BQU07b0JBQ1I7Z0JBQ0Y7WUFDRjtRQUNGO1FBRUEsTUFBTUcsb0JBQW9CWixlQUFlYSxHQUFHLENBQUMsQ0FBQ1osVUFBYTtnQkFDekRhLElBQUliLFFBQVFhLEVBQUU7Z0JBQ2RQLFNBQVNOLFFBQVFNLE9BQU87Z0JBQ3hCRyxTQUFTVCxRQUFRUyxPQUFPO2dCQUN4QkMsVUFBVVYsUUFBUVUsUUFBUTtnQkFDMUJJLFdBQVdkLFFBQVFjLFNBQVMsQ0FBQ0MsV0FBVztnQkFDeENDLFFBQVFoQixRQUFRZ0IsTUFBTTtnQkFDdEJDLFlBQVlDLFdBQVdsQixRQUFRaUIsVUFBVSxDQUFDRSxRQUFRO1lBQ3BEO1FBRUEsT0FBT3ZCLHFEQUFZQSxDQUFDd0IsSUFBSSxDQUFDVDtJQUMzQixFQUFFLE9BQU9VLE9BQU87UUFDZEMsUUFBUUQsS0FBSyxDQUFDLDhCQUE4QkE7UUFDNUMsT0FBT3pCLHFEQUFZQSxDQUFDd0IsSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBa0MsR0FBRztZQUFFTCxRQUFRO1FBQUk7SUFDdkY7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL2FsaWVuL0RldmVsb3BtZW50L3RpbmtlcnRhbmsvdGlua2VydGFuay1tYXJrZXQvc3JjL2FwcC9hcGkvYWRtaW4vYm9va2luZ3MvcmVjZW50L3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gJ0AvbGliL3ByaXNtYSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVjZW50Qm9va2luZ3MgPSBhd2FpdCBwcmlzbWEuYm9va2luZy5maW5kTWFueSh7XG4gICAgICB0YWtlOiAxMCxcbiAgICAgIG9yZGVyQnk6IHtcbiAgICAgICAgY3JlYXRlZEF0OiAnZGVzYycsXG4gICAgICB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBzdHVkZW50OiB7XG4gICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICBuYW1lOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHByb2R1Y3Q6IHtcbiAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBmb3JtYXR0ZWRCb29raW5ncyA9IHJlY2VudEJvb2tpbmdzLm1hcCgoYm9va2luZykgPT4gKHtcbiAgICAgIGlkOiBib29raW5nLmlkLFxuICAgICAgc3R1ZGVudDogYm9va2luZy5zdHVkZW50LFxuICAgICAgcHJvZHVjdDogYm9va2luZy5wcm9kdWN0LFxuICAgICAgbG9jYXRpb246IGJvb2tpbmcubG9jYXRpb24sXG4gICAgICBzdGFydERhdGU6IGJvb2tpbmcuc3RhcnREYXRlLnRvSVNPU3RyaW5nKCksXG4gICAgICBzdGF0dXM6IGJvb2tpbmcuc3RhdHVzLFxuICAgICAgdG90YWxQcmljZTogcGFyc2VGbG9hdChib29raW5nLnRvdGFsUHJpY2UudG9TdHJpbmcoKSksXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKGZvcm1hdHRlZEJvb2tpbmdzKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdSZWNlbnQgYm9va2luZ3MgQVBJIGVycm9yOicsIGVycm9yKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBmZXRjaCByZWNlbnQgYm9va2luZ3MnIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJwcmlzbWEiLCJHRVQiLCJyZWNlbnRCb29raW5ncyIsImJvb2tpbmciLCJmaW5kTWFueSIsInRha2UiLCJvcmRlckJ5IiwiY3JlYXRlZEF0IiwiaW5jbHVkZSIsInN0dWRlbnQiLCJzZWxlY3QiLCJuYW1lIiwicHJvZHVjdCIsImxvY2F0aW9uIiwiZm9ybWF0dGVkQm9va2luZ3MiLCJtYXAiLCJpZCIsInN0YXJ0RGF0ZSIsInRvSVNPU3RyaW5nIiwic3RhdHVzIiwidG90YWxQcmljZSIsInBhcnNlRmxvYXQiLCJ0b1N0cmluZyIsImpzb24iLCJlcnJvciIsImNvbnNvbGUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/admin/bookings/recent/route.ts\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&page=%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fbookings%2Frecent%2Froute.ts&appDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Falien%2FDevelopment%2Ftinkertank%2Ftinkertank-market&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();