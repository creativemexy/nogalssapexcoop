"use strict";
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
exports.id = "app/api/admin/dashboard-stats/route";
exports.ids = ["app/api/admin/dashboard-stats/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&page=%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fdashboard-stats%2Froute.ts&appDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&page=%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fdashboard-stats%2Froute.ts&appDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_mexy_Desktop_newNogalss_src_app_api_admin_dashboard_stats_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/admin/dashboard-stats/route.ts */ \"(rsc)/./src/app/api/admin/dashboard-stats/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/dashboard-stats/route\",\n        pathname: \"/api/admin/dashboard-stats\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/dashboard-stats/route\"\n    },\n    resolvedPagePath: \"/home/mexy/Desktop/newNogalss/src/app/api/admin/dashboard-stats/route.ts\",\n    nextConfigOutput,\n    userland: _home_mexy_Desktop_newNogalss_src_app_api_admin_dashboard_stats_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/admin/dashboard-stats/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRmRhc2hib2FyZC1zdGF0cyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYWRtaW4lMkZkYXNoYm9hcmQtc3RhdHMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhZG1pbiUyRmRhc2hib2FyZC1zdGF0cyUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGbWV4eSUyRkRlc2t0b3AlMkZuZXdOb2dhbHNzJTJGc3JjJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGbWV4eSUyRkRlc2t0b3AlMkZuZXdOb2dhbHNzJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUN3QjtBQUNyRztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL25vZ2Fsc3MtY29vcGVyYXRpdmUvPzdhZTAiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL2hvbWUvbWV4eS9EZXNrdG9wL25ld05vZ2Fsc3Mvc3JjL2FwcC9hcGkvYWRtaW4vZGFzaGJvYXJkLXN0YXRzL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hZG1pbi9kYXNoYm9hcmQtc3RhdHMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hZG1pbi9kYXNoYm9hcmQtc3RhdHNcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2FkbWluL2Rhc2hib2FyZC1zdGF0cy9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9ob21lL21leHkvRGVza3RvcC9uZXdOb2dhbHNzL3NyYy9hcHAvYXBpL2FkbWluL2Rhc2hib2FyZC1zdGF0cy9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvYWRtaW4vZGFzaGJvYXJkLXN0YXRzL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&page=%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fdashboard-stats%2Froute.ts&appDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/admin/dashboard-stats/route.ts":
/*!****************************************************!*\
  !*** ./src/app/api/admin/dashboard-stats/route.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\n\nasync function GET(request) {\n    try {\n        const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n        if (!session?.user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        // Check if user is super admin or apex\n        if (session.user.role !== \"SUPER_ADMIN\" && session.user.role !== \"APEX\") {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Forbidden\"\n            }, {\n                status: 403\n            });\n        }\n        // Fetch dashboard statistics\n        const [totalUsers, totalCooperatives, totalTransactions, pendingLoans, approvedLoans, rejectedLoans, totalContributionsResult, totalLoansResult] = await Promise.all([\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.count(),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.cooperative.count(),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.transaction.count(),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.loan.count({\n                where: {\n                    status: \"PENDING\"\n                }\n            }),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.loan.count({\n                where: {\n                    status: \"APPROVED\"\n                }\n            }),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.loan.count({\n                where: {\n                    status: \"REJECTED\"\n                }\n            }),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.contribution.aggregate({\n                _sum: {\n                    amount: true\n                }\n            }),\n            _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.loan.aggregate({\n                _sum: {\n                    amount: true\n                }\n            })\n        ]);\n        const totalContributions = totalContributionsResult._sum.amount || 0;\n        const totalLoans = totalLoansResult._sum.amount || 0;\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            totalUsers,\n            totalCooperatives,\n            totalTransactions,\n            pendingLoans,\n            approvedLoans,\n            rejectedLoans,\n            totalContributions,\n            totalLoans\n        });\n    } catch (error) {\n        console.error(\"Dashboard stats error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Internal server error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hZG1pbi9kYXNoYm9hcmQtc3RhdHMvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQXdEO0FBQ1g7QUFDSjtBQUNIO0FBRS9CLGVBQWVJLElBQUlDLE9BQW9CO0lBQzVDLElBQUk7UUFDRixNQUFNQyxVQUFVLE1BQU1MLDJEQUFnQkEsQ0FBQ0Msa0RBQVdBO1FBRWxELElBQUksQ0FBQ0ksU0FBU0MsTUFBTTtZQUNsQixPQUFPUCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQWUsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ3BFO1FBRUEsdUNBQXVDO1FBQ3ZDLElBQUlKLFFBQVFDLElBQUksQ0FBQ0ksSUFBSSxLQUFLLGlCQUFpQkwsUUFBUUMsSUFBSSxDQUFDSSxJQUFJLEtBQUssUUFBUTtZQUN2RSxPQUFPWCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQVksR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ2pFO1FBRUEsNkJBQTZCO1FBQzdCLE1BQU0sQ0FDSkUsWUFDQUMsbUJBQ0FDLG1CQUNBQyxjQUNBQyxlQUNBQyxlQUNBQywwQkFDQUMsaUJBQ0QsR0FBRyxNQUFNQyxRQUFRQyxHQUFHLENBQUM7WUFDcEJsQiwrQ0FBTUEsQ0FBQ0ksSUFBSSxDQUFDZSxLQUFLO1lBQ2pCbkIsK0NBQU1BLENBQUNvQixXQUFXLENBQUNELEtBQUs7WUFDeEJuQiwrQ0FBTUEsQ0FBQ3FCLFdBQVcsQ0FBQ0YsS0FBSztZQUN4Qm5CLCtDQUFNQSxDQUFDc0IsSUFBSSxDQUFDSCxLQUFLLENBQUM7Z0JBQUVJLE9BQU87b0JBQUVoQixRQUFRO2dCQUFVO1lBQUU7WUFDakRQLCtDQUFNQSxDQUFDc0IsSUFBSSxDQUFDSCxLQUFLLENBQUM7Z0JBQUVJLE9BQU87b0JBQUVoQixRQUFRO2dCQUFXO1lBQUU7WUFDbERQLCtDQUFNQSxDQUFDc0IsSUFBSSxDQUFDSCxLQUFLLENBQUM7Z0JBQUVJLE9BQU87b0JBQUVoQixRQUFRO2dCQUFXO1lBQUU7WUFDbERQLCtDQUFNQSxDQUFDd0IsWUFBWSxDQUFDQyxTQUFTLENBQUM7Z0JBQzVCQyxNQUFNO29CQUFFQyxRQUFRO2dCQUFLO1lBQ3ZCO1lBQ0EzQiwrQ0FBTUEsQ0FBQ3NCLElBQUksQ0FBQ0csU0FBUyxDQUFDO2dCQUNwQkMsTUFBTTtvQkFBRUMsUUFBUTtnQkFBSztZQUN2QjtTQUNEO1FBRUQsTUFBTUMscUJBQXFCYix5QkFBeUJXLElBQUksQ0FBQ0MsTUFBTSxJQUFJO1FBQ25FLE1BQU1FLGFBQWFiLGlCQUFpQlUsSUFBSSxDQUFDQyxNQUFNLElBQUk7UUFFbkQsT0FBTzlCLHFEQUFZQSxDQUFDUSxJQUFJLENBQUM7WUFDdkJJO1lBQ0FDO1lBQ0FDO1lBQ0FDO1lBQ0FDO1lBQ0FDO1lBQ0FjO1lBQ0FDO1FBQ0Y7SUFFRixFQUFFLE9BQU92QixPQUFPO1FBQ2R3QixRQUFReEIsS0FBSyxDQUFDLDBCQUEwQkE7UUFDeEMsT0FBT1QscURBQVlBLENBQUNRLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQXdCLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQzdFO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ub2dhbHNzLWNvb3BlcmF0aXZlLy4vc3JjL2FwcC9hcGkvYWRtaW4vZGFzaGJvYXJkLXN0YXRzL3JvdXRlLnRzPzBiMDUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IGdldFNlcnZlclNlc3Npb24gfSBmcm9tICduZXh0LWF1dGgnO1xuaW1wb3J0IHsgYXV0aE9wdGlvbnMgfSBmcm9tICdAL2xpYi9hdXRoJztcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gJ0AvbGliL3ByaXNtYSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2VydmVyU2Vzc2lvbihhdXRoT3B0aW9ucyk7XG4gICAgXG4gICAgaWYgKCFzZXNzaW9uPy51c2VyKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGlzIHN1cGVyIGFkbWluIG9yIGFwZXhcbiAgICBpZiAoc2Vzc2lvbi51c2VyLnJvbGUgIT09ICdTVVBFUl9BRE1JTicgJiYgc2Vzc2lvbi51c2VyLnJvbGUgIT09ICdBUEVYJykge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdGb3JiaWRkZW4nIH0sIHsgc3RhdHVzOiA0MDMgfSk7XG4gICAgfVxuXG4gICAgLy8gRmV0Y2ggZGFzaGJvYXJkIHN0YXRpc3RpY3NcbiAgICBjb25zdCBbXG4gICAgICB0b3RhbFVzZXJzLFxuICAgICAgdG90YWxDb29wZXJhdGl2ZXMsXG4gICAgICB0b3RhbFRyYW5zYWN0aW9ucyxcbiAgICAgIHBlbmRpbmdMb2FucyxcbiAgICAgIGFwcHJvdmVkTG9hbnMsXG4gICAgICByZWplY3RlZExvYW5zLFxuICAgICAgdG90YWxDb250cmlidXRpb25zUmVzdWx0LFxuICAgICAgdG90YWxMb2Fuc1Jlc3VsdCxcbiAgICBdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgcHJpc21hLnVzZXIuY291bnQoKSxcbiAgICAgIHByaXNtYS5jb29wZXJhdGl2ZS5jb3VudCgpLFxuICAgICAgcHJpc21hLnRyYW5zYWN0aW9uLmNvdW50KCksXG4gICAgICBwcmlzbWEubG9hbi5jb3VudCh7IHdoZXJlOiB7IHN0YXR1czogJ1BFTkRJTkcnIH0gfSksXG4gICAgICBwcmlzbWEubG9hbi5jb3VudCh7IHdoZXJlOiB7IHN0YXR1czogJ0FQUFJPVkVEJyB9IH0pLFxuICAgICAgcHJpc21hLmxvYW4uY291bnQoeyB3aGVyZTogeyBzdGF0dXM6ICdSRUpFQ1RFRCcgfSB9KSxcbiAgICAgIHByaXNtYS5jb250cmlidXRpb24uYWdncmVnYXRlKHtcbiAgICAgICAgX3N1bTogeyBhbW91bnQ6IHRydWUgfSxcbiAgICAgIH0pLFxuICAgICAgcHJpc21hLmxvYW4uYWdncmVnYXRlKHtcbiAgICAgICAgX3N1bTogeyBhbW91bnQ6IHRydWUgfSxcbiAgICAgIH0pLFxuICAgIF0pO1xuXG4gICAgY29uc3QgdG90YWxDb250cmlidXRpb25zID0gdG90YWxDb250cmlidXRpb25zUmVzdWx0Ll9zdW0uYW1vdW50IHx8IDA7XG4gICAgY29uc3QgdG90YWxMb2FucyA9IHRvdGFsTG9hbnNSZXN1bHQuX3N1bS5hbW91bnQgfHwgMDtcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XG4gICAgICB0b3RhbFVzZXJzLFxuICAgICAgdG90YWxDb29wZXJhdGl2ZXMsXG4gICAgICB0b3RhbFRyYW5zYWN0aW9ucyxcbiAgICAgIHBlbmRpbmdMb2FucyxcbiAgICAgIGFwcHJvdmVkTG9hbnMsXG4gICAgICByZWplY3RlZExvYW5zLFxuICAgICAgdG90YWxDb250cmlidXRpb25zLFxuICAgICAgdG90YWxMb2FucyxcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Rhc2hib2FyZCBzdGF0cyBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn0gIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImdldFNlcnZlclNlc3Npb24iLCJhdXRoT3B0aW9ucyIsInByaXNtYSIsIkdFVCIsInJlcXVlc3QiLCJzZXNzaW9uIiwidXNlciIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsInJvbGUiLCJ0b3RhbFVzZXJzIiwidG90YWxDb29wZXJhdGl2ZXMiLCJ0b3RhbFRyYW5zYWN0aW9ucyIsInBlbmRpbmdMb2FucyIsImFwcHJvdmVkTG9hbnMiLCJyZWplY3RlZExvYW5zIiwidG90YWxDb250cmlidXRpb25zUmVzdWx0IiwidG90YWxMb2Fuc1Jlc3VsdCIsIlByb21pc2UiLCJhbGwiLCJjb3VudCIsImNvb3BlcmF0aXZlIiwidHJhbnNhY3Rpb24iLCJsb2FuIiwid2hlcmUiLCJjb250cmlidXRpb24iLCJhZ2dyZWdhdGUiLCJfc3VtIiwiYW1vdW50IiwidG90YWxDb250cmlidXRpb25zIiwidG90YWxMb2FucyIsImNvbnNvbGUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/admin/dashboard-stats/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @auth/prisma-adapter */ \"(rsc)/./node_modules/@auth/prisma-adapter/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n\n\n\n\nconst authOptions = {\n    adapter: (0,_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma),\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    return null;\n                }\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    }\n                });\n                if (!user || !user.password) {\n                    return null;\n                }\n                const isPasswordValid = await bcryptjs__WEBPACK_IMPORTED_MODULE_3__[\"default\"].compare(credentials.password, user.password);\n                if (!isPasswordValid) {\n                    return null;\n                }\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: `${user.firstName} ${user.lastName}`,\n                    role: user.role,\n                    cooperativeId: user.cooperativeId,\n                    leaderId: user.leaderId,\n                    apexId: user.apexId,\n                    businessId: user.businessId\n                };\n            }\n        })\n    ],\n    session: {\n        strategy: \"jwt\"\n    },\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.role = user.role;\n                token.cooperativeId = user.cooperativeId;\n                token.leaderId = user.leaderId;\n                token.apexId = user.apexId;\n                token.businessId = user.businessId;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (token) {\n                session.user.id = token.sub;\n                session.user.role = token.role;\n                session.user.cooperativeId = token.cooperativeId;\n                session.user.leaderId = token.leaderId;\n                session.user.apexId = token.apexId;\n                session.user.businessId = token.businessId;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/auth/signin\",\n        error: \"/auth/error\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGgudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFDa0U7QUFDYjtBQUNmO0FBQ1I7QUFFdkIsTUFBTUksY0FBK0I7SUFDMUNDLFNBQVNKLG1FQUFhQSxDQUFDQywrQ0FBTUE7SUFDN0JJLFdBQVc7UUFDVE4sMkVBQW1CQSxDQUFDO1lBQ2xCTyxNQUFNO1lBQ05DLGFBQWE7Z0JBQ1hDLE9BQU87b0JBQUVDLE9BQU87b0JBQVNDLE1BQU07Z0JBQVE7Z0JBQ3ZDQyxVQUFVO29CQUFFRixPQUFPO29CQUFZQyxNQUFNO2dCQUFXO1lBQ2xEO1lBQ0EsTUFBTUUsV0FBVUwsV0FBVztnQkFDekIsSUFBSSxDQUFDQSxhQUFhQyxTQUFTLENBQUNELGFBQWFJLFVBQVU7b0JBQ2pELE9BQU87Z0JBQ1Q7Z0JBRUEsTUFBTUUsT0FBTyxNQUFNWiwrQ0FBTUEsQ0FBQ1ksSUFBSSxDQUFDQyxVQUFVLENBQUM7b0JBQ3hDQyxPQUFPO3dCQUNMUCxPQUFPRCxZQUFZQyxLQUFLO29CQUMxQjtnQkFDRjtnQkFFQSxJQUFJLENBQUNLLFFBQVEsQ0FBQ0EsS0FBS0YsUUFBUSxFQUFFO29CQUMzQixPQUFPO2dCQUNUO2dCQUVBLE1BQU1LLGtCQUFrQixNQUFNZCx3REFBYyxDQUMxQ0ssWUFBWUksUUFBUSxFQUNwQkUsS0FBS0YsUUFBUTtnQkFHZixJQUFJLENBQUNLLGlCQUFpQjtvQkFDcEIsT0FBTztnQkFDVDtnQkFFQSxPQUFPO29CQUNMRSxJQUFJTCxLQUFLSyxFQUFFO29CQUNYVixPQUFPSyxLQUFLTCxLQUFLO29CQUNqQkYsTUFBTSxDQUFDLEVBQUVPLEtBQUtNLFNBQVMsQ0FBQyxDQUFDLEVBQUVOLEtBQUtPLFFBQVEsQ0FBQyxDQUFDO29CQUMxQ0MsTUFBTVIsS0FBS1EsSUFBSTtvQkFDZkMsZUFBZVQsS0FBS1MsYUFBYTtvQkFDakNDLFVBQVVWLEtBQUtVLFFBQVE7b0JBQ3ZCQyxRQUFRWCxLQUFLVyxNQUFNO29CQUNuQkMsWUFBWVosS0FBS1ksVUFBVTtnQkFDN0I7WUFDRjtRQUNGO0tBQ0Q7SUFDREMsU0FBUztRQUNQQyxVQUFVO0lBQ1o7SUFDQUMsV0FBVztRQUNULE1BQU1DLEtBQUksRUFBRUMsS0FBSyxFQUFFakIsSUFBSSxFQUFFO1lBQ3ZCLElBQUlBLE1BQU07Z0JBQ1JpQixNQUFNVCxJQUFJLEdBQUdSLEtBQUtRLElBQUk7Z0JBQ3RCUyxNQUFNUixhQUFhLEdBQUdULEtBQUtTLGFBQWE7Z0JBQ3hDUSxNQUFNUCxRQUFRLEdBQUdWLEtBQUtVLFFBQVE7Z0JBQzlCTyxNQUFNTixNQUFNLEdBQUdYLEtBQUtXLE1BQU07Z0JBQzFCTSxNQUFNTCxVQUFVLEdBQUdaLEtBQUtZLFVBQVU7WUFDcEM7WUFDQSxPQUFPSztRQUNUO1FBQ0EsTUFBTUosU0FBUSxFQUFFQSxPQUFPLEVBQUVJLEtBQUssRUFBRTtZQUM5QixJQUFJQSxPQUFPO2dCQUNUSixRQUFRYixJQUFJLENBQUNLLEVBQUUsR0FBR1ksTUFBTUMsR0FBRztnQkFDM0JMLFFBQVFiLElBQUksQ0FBQ1EsSUFBSSxHQUFHUyxNQUFNVCxJQUFJO2dCQUM5QkssUUFBUWIsSUFBSSxDQUFDUyxhQUFhLEdBQUdRLE1BQU1SLGFBQWE7Z0JBQ2hESSxRQUFRYixJQUFJLENBQUNVLFFBQVEsR0FBR08sTUFBTVAsUUFBUTtnQkFDdENHLFFBQVFiLElBQUksQ0FBQ1csTUFBTSxHQUFHTSxNQUFNTixNQUFNO2dCQUNsQ0UsUUFBUWIsSUFBSSxDQUFDWSxVQUFVLEdBQUdLLE1BQU1MLFVBQVU7WUFDNUM7WUFDQSxPQUFPQztRQUNUO0lBQ0Y7SUFDQU0sT0FBTztRQUNMQyxRQUFRO1FBQ1JDLE9BQU87SUFDVDtBQUNGLEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ub2dhbHNzLWNvb3BlcmF0aXZlLy4vc3JjL2xpYi9hdXRoLnRzPzY2OTIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dEF1dGhPcHRpb25zIH0gZnJvbSBcIm5leHQtYXV0aFwiO1xuaW1wb3J0IENyZWRlbnRpYWxzUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHNcIjtcbmltcG9ydCB7IFByaXNtYUFkYXB0ZXIgfSBmcm9tIFwiQGF1dGgvcHJpc21hLWFkYXB0ZXJcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogTmV4dEF1dGhPcHRpb25zID0ge1xuICBhZGFwdGVyOiBQcmlzbWFBZGFwdGVyKHByaXNtYSksXG4gIHByb3ZpZGVyczogW1xuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgbmFtZTogXCJjcmVkZW50aWFsc1wiLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6IFwiRW1haWxcIiwgdHlwZTogXCJlbWFpbFwiIH0sXG4gICAgICAgIHBhc3N3b3JkOiB7IGxhYmVsOiBcIlBhc3N3b3JkXCIsIHR5cGU6IFwicGFzc3dvcmRcIiB9XG4gICAgICB9LFxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgIGlmICghY3JlZGVudGlhbHM/LmVtYWlsIHx8ICFjcmVkZW50aWFscz8ucGFzc3dvcmQpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgZW1haWw6IGNyZWRlbnRpYWxzLmVtYWlsXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXVzZXIgfHwgIXVzZXIucGFzc3dvcmQpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzUGFzc3dvcmRWYWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKFxuICAgICAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgICAgIHVzZXIucGFzc3dvcmRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWlzUGFzc3dvcmRWYWxpZCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogdXNlci5pZCxcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICBuYW1lOiBgJHt1c2VyLmZpcnN0TmFtZX0gJHt1c2VyLmxhc3ROYW1lfWAsXG4gICAgICAgICAgcm9sZTogdXNlci5yb2xlLFxuICAgICAgICAgIGNvb3BlcmF0aXZlSWQ6IHVzZXIuY29vcGVyYXRpdmVJZCxcbiAgICAgICAgICBsZWFkZXJJZDogdXNlci5sZWFkZXJJZCxcbiAgICAgICAgICBhcGV4SWQ6IHVzZXIuYXBleElkLFxuICAgICAgICAgIGJ1c2luZXNzSWQ6IHVzZXIuYnVzaW5lc3NJZCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KVxuICBdLFxuICBzZXNzaW9uOiB7XG4gICAgc3RyYXRlZ3k6IFwiand0XCJcbiAgfSxcbiAgY2FsbGJhY2tzOiB7XG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIgfSkge1xuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdG9rZW4ucm9sZSA9IHVzZXIucm9sZTtcbiAgICAgICAgdG9rZW4uY29vcGVyYXRpdmVJZCA9IHVzZXIuY29vcGVyYXRpdmVJZDtcbiAgICAgICAgdG9rZW4ubGVhZGVySWQgPSB1c2VyLmxlYWRlcklkO1xuICAgICAgICB0b2tlbi5hcGV4SWQgPSB1c2VyLmFwZXhJZDtcbiAgICAgICAgdG9rZW4uYnVzaW5lc3NJZCA9IHVzZXIuYnVzaW5lc3NJZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9LFxuICAgIGFzeW5jIHNlc3Npb24oeyBzZXNzaW9uLCB0b2tlbiB9KSB7XG4gICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgc2Vzc2lvbi51c2VyLmlkID0gdG9rZW4uc3ViITtcbiAgICAgICAgc2Vzc2lvbi51c2VyLnJvbGUgPSB0b2tlbi5yb2xlIGFzIGFueTtcbiAgICAgICAgc2Vzc2lvbi51c2VyLmNvb3BlcmF0aXZlSWQgPSB0b2tlbi5jb29wZXJhdGl2ZUlkIGFzIHN0cmluZztcbiAgICAgICAgc2Vzc2lvbi51c2VyLmxlYWRlcklkID0gdG9rZW4ubGVhZGVySWQgYXMgc3RyaW5nO1xuICAgICAgICBzZXNzaW9uLnVzZXIuYXBleElkID0gdG9rZW4uYXBleElkIGFzIHN0cmluZztcbiAgICAgICAgc2Vzc2lvbi51c2VyLmJ1c2luZXNzSWQgPSB0b2tlbi5idXNpbmVzc0lkIGFzIHN0cmluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXNzaW9uO1xuICAgIH1cbiAgfSxcbiAgcGFnZXM6IHtcbiAgICBzaWduSW46IFwiL2F1dGgvc2lnbmluXCIsXG4gICAgZXJyb3I6IFwiL2F1dGgvZXJyb3JcIixcbiAgfVxufTsgIl0sIm5hbWVzIjpbIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJQcmlzbWFBZGFwdGVyIiwicHJpc21hIiwiYmNyeXB0IiwiYXV0aE9wdGlvbnMiLCJhZGFwdGVyIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJpc1Bhc3N3b3JkVmFsaWQiLCJjb21wYXJlIiwiaWQiLCJmaXJzdE5hbWUiLCJsYXN0TmFtZSIsInJvbGUiLCJjb29wZXJhdGl2ZUlkIiwibGVhZGVySWQiLCJhcGV4SWQiLCJidXNpbmVzc0lkIiwic2Vzc2lvbiIsInN0cmF0ZWd5IiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJzdWIiLCJwYWdlcyIsInNpZ25JbiIsImVycm9yIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBNkM7QUFFN0MsTUFBTUMsa0JBQWtCQztBQUlqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFBSSxJQUFJSCx3REFBWUEsR0FBRTtBQUVsRSxJQUFJSSxJQUF5QixFQUFjSCxnQkFBZ0JFLE1BQU0sR0FBR0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ub2dhbHNzLWNvb3BlcmF0aXZlLy4vc3JjL2xpYi9wcmlzbWEudHM/MDFkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcblxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHtcbiAgcHJpc21hOiBQcmlzbWFDbGllbnQgfCB1bmRlZmluZWRcbn1cblxuZXhwb3J0IGNvbnN0IHByaXNtYSA9IGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPz8gbmV3IFByaXNtYUNsaWVudCgpXG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID0gcHJpc21hICJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/@auth","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&page=%2Fapi%2Fadmin%2Fdashboard-stats%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fdashboard-stats%2Froute.ts&appDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fmexy%2FDesktop%2FnewNogalss&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();