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
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "__barrel_optimize__?names=CssBaseline,ThemeProvider!=!./node_modules/@mui/material/index.js":
/*!***************************************************************************************************!*\
  !*** __barrel_optimize__?names=CssBaseline,ThemeProvider!=!./node_modules/@mui/material/index.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CssBaseline: () => (/* reexport safe */ _CssBaseline_index_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"]),\n/* harmony export */   ThemeProvider: () => (/* reexport safe */ D_My_Projects_InterviewCopilot_node_modules_mui_material_styles_index_js__WEBPACK_IMPORTED_MODULE_1__.ThemeProvider)\n/* harmony export */ });\n/* harmony import */ var _CssBaseline_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CssBaseline/index.js */ \"./node_modules/@mui/material/CssBaseline/index.js\");\n/* harmony import */ var D_My_Projects_InterviewCopilot_node_modules_mui_material_styles_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@mui/material/styles/index.js */ \"./node_modules/@mui/material/styles/index.js\");\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX19iYXJyZWxfb3B0aW1pemVfXz9uYW1lcz1Dc3NCYXNlbGluZSxUaGVtZVByb3ZpZGVyIT0hLi9ub2RlX21vZHVsZXMvQG11aS9tYXRlcmlhbC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUMrRCIsInNvdXJjZXMiOlsiRDpcXE15IFByb2plY3RzXFxJbnRlcnZpZXdDb3BpbG90XFxub2RlX21vZHVsZXNcXEBtdWlcXG1hdGVyaWFsXFxpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgQ3NzQmFzZWxpbmUgfSBmcm9tIFwiLi9Dc3NCYXNlbGluZS9pbmRleC5qc1wiXG5leHBvcnQgeyBUaGVtZVByb3ZpZGVyIH0gZnJvbSBcIkQ6XFxcXE15IFByb2plY3RzXFxcXEludGVydmlld0NvcGlsb3RcXFxcbm9kZV9tb2R1bGVzXFxcXEBtdWlcXFxcbWF0ZXJpYWxcXFxcc3R5bGVzXFxcXGluZGV4LmpzXCIiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///__barrel_optimize__?names=CssBaseline,ThemeProvider!=!./node_modules/@mui/material/index.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _barrel_optimize_names_CssBaseline_ThemeProvider_mui_material__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=CssBaseline,ThemeProvider!=!@mui/material */ \"__barrel_optimize__?names=CssBaseline,ThemeProvider!=!./node_modules/@mui/material/index.js\");\n/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-redux */ \"react-redux\");\n/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../store */ \"./store.js\");\n/* harmony import */ var _theme__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../theme */ \"./theme.js\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_redux__WEBPACK_IMPORTED_MODULE_1__, _store__WEBPACK_IMPORTED_MODULE_2__]);\n([react_redux__WEBPACK_IMPORTED_MODULE_1__, _store__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n // 👈 Adjust this path if your store file is located elsewhere (e.g., ../redux/store or ../src/store)\n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_redux__WEBPACK_IMPORTED_MODULE_1__.Provider, {\n        store: _store__WEBPACK_IMPORTED_MODULE_2__[\"default\"],\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_CssBaseline_ThemeProvider_mui_material__WEBPACK_IMPORTED_MODULE_5__.ThemeProvider, {\n            theme: _theme__WEBPACK_IMPORTED_MODULE_3__[\"default\"],\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_CssBaseline_ThemeProvider_mui_material__WEBPACK_IMPORTED_MODULE_5__.CssBaseline, {}, void 0, false, {\n                    fileName: \"D:\\\\My Projects\\\\InterviewCopilot\\\\pages\\\\_app.js\",\n                    lineNumber: 11,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"D:\\\\My Projects\\\\InterviewCopilot\\\\pages\\\\_app.js\",\n                    lineNumber: 12,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"D:\\\\My Projects\\\\InterviewCopilot\\\\pages\\\\_app.js\",\n            lineNumber: 10,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"D:\\\\My Projects\\\\InterviewCopilot\\\\pages\\\\_app.js\",\n        lineNumber: 9,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBMkQ7QUFDcEI7QUFDVixDQUFDLHFHQUFxRztBQUNsRztBQUNGO0FBRS9CLFNBQVNLLE1BQU0sRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQUU7SUFDckMscUJBQ0UsOERBQUNMLGlEQUFRQTtRQUFDQyxPQUFPQSw4Q0FBS0E7a0JBQ3BCLDRFQUFDSCx3R0FBYUE7WUFBQ1EsT0FBT0osOENBQVNBOzs4QkFDN0IsOERBQUNILHNHQUFXQTs7Ozs7OEJBQ1osOERBQUNLO29CQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWhDO0FBRUEsaUVBQWVGLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIkQ6XFxNeSBQcm9qZWN0c1xcSW50ZXJ2aWV3Q29waWxvdFxccGFnZXNcXF9hcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGhlbWVQcm92aWRlciwgQ3NzQmFzZWxpbmUgfSBmcm9tICdAbXVpL21hdGVyaWFsJztcclxuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCBzdG9yZSBmcm9tICcuLi9zdG9yZSc7IC8vIPCfkYggQWRqdXN0IHRoaXMgcGF0aCBpZiB5b3VyIHN0b3JlIGZpbGUgaXMgbG9jYXRlZCBlbHNld2hlcmUgKGUuZy4sIC4uL3JlZHV4L3N0b3JlIG9yIC4uL3NyYy9zdG9yZSlcclxuaW1wb3J0IGRhcmtUaGVtZSBmcm9tICcuLi90aGVtZSc7XHJcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcclxuXHJcbmZ1bmN0aW9uIE15QXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfSkge1xyXG4gIHJldHVybiAoXHJcbiAgICA8UHJvdmlkZXIgc3RvcmU9e3N0b3JlfT5cclxuICAgICAgPFRoZW1lUHJvdmlkZXIgdGhlbWU9e2RhcmtUaGVtZX0+XHJcbiAgICAgICAgPENzc0Jhc2VsaW5lIC8+XHJcbiAgICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxyXG4gICAgICA8L1RoZW1lUHJvdmlkZXI+XHJcbiAgICA8L1Byb3ZpZGVyPlxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE15QXBwOyJdLCJuYW1lcyI6WyJUaGVtZVByb3ZpZGVyIiwiQ3NzQmFzZWxpbmUiLCJQcm92aWRlciIsInN0b3JlIiwiZGFya1RoZW1lIiwiTXlBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJ0aGVtZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./reducers.js":
/*!*********************!*\
  !*** ./reducers.js ***!
  \*********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var redux__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! redux */ \"redux\");\n/* harmony import */ var _redux_transcriptionSlice__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./redux/transcriptionSlice */ \"./redux/transcriptionSlice.js\");\n/* harmony import */ var _redux_aiResponseSlice__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./redux/aiResponseSlice */ \"./redux/aiResponseSlice.js\");\n/* harmony import */ var _redux_historySlice__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./redux/historySlice */ \"./redux/historySlice.js\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([redux__WEBPACK_IMPORTED_MODULE_0__, _redux_transcriptionSlice__WEBPACK_IMPORTED_MODULE_1__, _redux_aiResponseSlice__WEBPACK_IMPORTED_MODULE_2__, _redux_historySlice__WEBPACK_IMPORTED_MODULE_3__]);\n([redux__WEBPACK_IMPORTED_MODULE_0__, _redux_transcriptionSlice__WEBPACK_IMPORTED_MODULE_1__, _redux_aiResponseSlice__WEBPACK_IMPORTED_MODULE_2__, _redux_historySlice__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\nconst rootReducer = (0,redux__WEBPACK_IMPORTED_MODULE_0__.combineReducers)({\n    transcription: _redux_transcriptionSlice__WEBPACK_IMPORTED_MODULE_1__[\"default\"],\n    aiResponse: _redux_aiResponseSlice__WEBPACK_IMPORTED_MODULE_2__[\"default\"],\n    history: _redux_historySlice__WEBPACK_IMPORTED_MODULE_3__[\"default\"]\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (rootReducer);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9yZWR1Y2Vycy5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUF3QztBQUNzQjtBQUNOO0FBQ047QUFFbEQsTUFBTUksY0FBY0osc0RBQWVBLENBQUM7SUFDbENLLGVBQWVKLGlFQUFvQkE7SUFDbkNLLFlBQVlKLDhEQUFpQkE7SUFDN0JLLFNBQVNKLDJEQUFjQTtBQUN6QjtBQUVBLGlFQUFlQyxXQUFXQSxFQUFDIiwic291cmNlcyI6WyJEOlxcTXkgUHJvamVjdHNcXEludGVydmlld0NvcGlsb3RcXHJlZHVjZXJzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbWJpbmVSZWR1Y2VycyB9IGZyb20gJ3JlZHV4JztcbmltcG9ydCB0cmFuc2NyaXB0aW9uUmVkdWNlciBmcm9tICcuL3JlZHV4L3RyYW5zY3JpcHRpb25TbGljZSc7XG5pbXBvcnQgYWlSZXNwb25zZVJlZHVjZXIgZnJvbSAnLi9yZWR1eC9haVJlc3BvbnNlU2xpY2UnO1xuaW1wb3J0IGhpc3RvcnlSZWR1Y2VyIGZyb20gJy4vcmVkdXgvaGlzdG9yeVNsaWNlJztcblxuY29uc3Qgcm9vdFJlZHVjZXIgPSBjb21iaW5lUmVkdWNlcnMoe1xuICB0cmFuc2NyaXB0aW9uOiB0cmFuc2NyaXB0aW9uUmVkdWNlcixcbiAgYWlSZXNwb25zZTogYWlSZXNwb25zZVJlZHVjZXIsXG4gIGhpc3Rvcnk6IGhpc3RvcnlSZWR1Y2VyLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHJvb3RSZWR1Y2VyO1xuIl0sIm5hbWVzIjpbImNvbWJpbmVSZWR1Y2VycyIsInRyYW5zY3JpcHRpb25SZWR1Y2VyIiwiYWlSZXNwb25zZVJlZHVjZXIiLCJoaXN0b3J5UmVkdWNlciIsInJvb3RSZWR1Y2VyIiwidHJhbnNjcmlwdGlvbiIsImFpUmVzcG9uc2UiLCJoaXN0b3J5Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./reducers.js\n");

/***/ }),

/***/ "./redux/aiResponseSlice.js":
/*!**********************************!*\
  !*** ./redux/aiResponseSlice.js ***!
  \**********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   aiResponseSlice: () => (/* binding */ aiResponseSlice),\n/* harmony export */   appendAIResponse: () => (/* binding */ appendAIResponse),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   setAIResponse: () => (/* binding */ setAIResponse)\n/* harmony export */ });\n/* harmony import */ var _reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @reduxjs/toolkit */ \"@reduxjs/toolkit\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__]);\n_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\nconst aiResponseSlice = (0,_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__.createSlice)({\n    name: 'aiResponse',\n    initialState: '',\n    reducers: {\n        setAIResponse: (state, action)=>action.payload,\n        appendAIResponse: (state, action)=>state + action.payload\n    }\n});\nconst { setAIResponse, appendAIResponse } = aiResponseSlice.actions;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (aiResponseSlice.reducer);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9yZWR1eC9haVJlc3BvbnNlU2xpY2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBK0M7QUFFeEMsTUFBTUMsa0JBQWtCRCw2REFBV0EsQ0FBQztJQUN6Q0UsTUFBTTtJQUNOQyxjQUFjO0lBQ2RDLFVBQVU7UUFDUkMsZUFBZSxDQUFDQyxPQUFPQyxTQUFXQSxPQUFPQyxPQUFPO1FBQ2hEQyxrQkFBa0IsQ0FBQ0gsT0FBT0MsU0FBV0QsUUFBUUMsT0FBT0MsT0FBTztJQUM3RDtBQUNGLEdBQUc7QUFFSSxNQUFNLEVBQUVILGFBQWEsRUFBRUksZ0JBQWdCLEVBQUUsR0FBR1IsZ0JBQWdCUyxPQUFPLENBQUM7QUFDM0UsaUVBQWVULGdCQUFnQlUsT0FBTyxFQUFDIiwic291cmNlcyI6WyJEOlxcTXkgUHJvamVjdHNcXEludGVydmlld0NvcGlsb3RcXHJlZHV4XFxhaVJlc3BvbnNlU2xpY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlU2xpY2UgfSBmcm9tICdAcmVkdXhqcy90b29sa2l0JztcclxuXHJcbmV4cG9ydCBjb25zdCBhaVJlc3BvbnNlU2xpY2UgPSBjcmVhdGVTbGljZSh7XHJcbiAgbmFtZTogJ2FpUmVzcG9uc2UnLFxyXG4gIGluaXRpYWxTdGF0ZTogJycsXHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIHNldEFJUmVzcG9uc2U6IChzdGF0ZSwgYWN0aW9uKSA9PiBhY3Rpb24ucGF5bG9hZCxcclxuICAgIGFwcGVuZEFJUmVzcG9uc2U6IChzdGF0ZSwgYWN0aW9uKSA9PiBzdGF0ZSArIGFjdGlvbi5wYXlsb2FkLFxyXG4gIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHsgc2V0QUlSZXNwb25zZSwgYXBwZW5kQUlSZXNwb25zZSB9ID0gYWlSZXNwb25zZVNsaWNlLmFjdGlvbnM7XHJcbmV4cG9ydCBkZWZhdWx0IGFpUmVzcG9uc2VTbGljZS5yZWR1Y2VyOyJdLCJuYW1lcyI6WyJjcmVhdGVTbGljZSIsImFpUmVzcG9uc2VTbGljZSIsIm5hbWUiLCJpbml0aWFsU3RhdGUiLCJyZWR1Y2VycyIsInNldEFJUmVzcG9uc2UiLCJzdGF0ZSIsImFjdGlvbiIsInBheWxvYWQiLCJhcHBlbmRBSVJlc3BvbnNlIiwiYWN0aW9ucyIsInJlZHVjZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./redux/aiResponseSlice.js\n");

/***/ }),

/***/ "./redux/historySlice.js":
/*!*******************************!*\
  !*** ./redux/historySlice.js ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   addToHistory: () => (/* binding */ addToHistory),\n/* harmony export */   clearHistory: () => (/* binding */ clearHistory),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   updateLatestQuestion: () => (/* binding */ updateLatestQuestion)\n/* harmony export */ });\n/* harmony import */ var _reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @reduxjs/toolkit */ \"@reduxjs/toolkit\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__]);\n_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\nconst historySlice = (0,_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__.createSlice)({\n    name: 'history',\n    initialState: [],\n    reducers: {\n        addToHistory: (state, action)=>{\n            state.push(action.payload);\n        },\n        clearHistory: ()=>[],\n        updateLatestQuestion: (state, action)=>{\n            const { utteranceId, text, status } = action.payload || {};\n            if (!utteranceId) return;\n            for(let i = state.length - 1; i >= 0; i -= 1){\n                if (state[i].type === \"question\" && state[i].utteranceId === utteranceId) {\n                    if (typeof text === \"string\") state[i].text = text;\n                    if (status) state[i].status = status;\n                    return;\n                }\n            }\n        }\n    }\n});\nconst { addToHistory, clearHistory, updateLatestQuestion } = historySlice.actions;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (historySlice.reducer);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9yZWR1eC9oaXN0b3J5U2xpY2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBK0M7QUFFL0MsTUFBTUMsZUFBZUQsNkRBQVdBLENBQUM7SUFDL0JFLE1BQU07SUFDTkMsY0FBYyxFQUFFO0lBQ2hCQyxVQUFVO1FBQ1JDLGNBQWMsQ0FBQ0MsT0FBT0M7WUFDcEJELE1BQU1FLElBQUksQ0FBQ0QsT0FBT0UsT0FBTztRQUMzQjtRQUNBQyxjQUFjLElBQU0sRUFBRTtRQUN0QkMsc0JBQXNCLENBQUNMLE9BQU9DO1lBQzVCLE1BQU0sRUFBRUssV0FBVyxFQUFFQyxJQUFJLEVBQUVDLE1BQU0sRUFBRSxHQUFHUCxPQUFPRSxPQUFPLElBQUksQ0FBQztZQUN6RCxJQUFJLENBQUNHLGFBQWE7WUFDbEIsSUFBSyxJQUFJRyxJQUFJVCxNQUFNVSxNQUFNLEdBQUcsR0FBR0QsS0FBSyxHQUFHQSxLQUFLLEVBQUc7Z0JBQzdDLElBQUlULEtBQUssQ0FBQ1MsRUFBRSxDQUFDRSxJQUFJLEtBQUssY0FBY1gsS0FBSyxDQUFDUyxFQUFFLENBQUNILFdBQVcsS0FBS0EsYUFBYTtvQkFDeEUsSUFBSSxPQUFPQyxTQUFTLFVBQVVQLEtBQUssQ0FBQ1MsRUFBRSxDQUFDRixJQUFJLEdBQUdBO29CQUM5QyxJQUFJQyxRQUFRUixLQUFLLENBQUNTLEVBQUUsQ0FBQ0QsTUFBTSxHQUFHQTtvQkFDOUI7Z0JBQ0Y7WUFDRjtRQUNGO0lBQ0Y7QUFDRjtBQUVPLE1BQU0sRUFBRVQsWUFBWSxFQUFFSyxZQUFZLEVBQUVDLG9CQUFvQixFQUFFLEdBQUdWLGFBQWFpQixPQUFPLENBQUM7QUFDekYsaUVBQWVqQixhQUFha0IsT0FBTyxFQUFDIiwic291cmNlcyI6WyJEOlxcTXkgUHJvamVjdHNcXEludGVydmlld0NvcGlsb3RcXHJlZHV4XFxoaXN0b3J5U2xpY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlU2xpY2UgfSBmcm9tICdAcmVkdXhqcy90b29sa2l0JztcclxuXHJcbmNvbnN0IGhpc3RvcnlTbGljZSA9IGNyZWF0ZVNsaWNlKHtcclxuICBuYW1lOiAnaGlzdG9yeScsXHJcbiAgaW5pdGlhbFN0YXRlOiBbXSxcclxuICByZWR1Y2Vyczoge1xyXG4gICAgYWRkVG9IaXN0b3J5OiAoc3RhdGUsIGFjdGlvbikgPT4ge1xyXG4gICAgICBzdGF0ZS5wdXNoKGFjdGlvbi5wYXlsb2FkKTtcclxuICAgIH0sXHJcbiAgICBjbGVhckhpc3Rvcnk6ICgpID0+IFtdLFxyXG4gICAgdXBkYXRlTGF0ZXN0UXVlc3Rpb246IChzdGF0ZSwgYWN0aW9uKSA9PiB7XHJcbiAgICAgIGNvbnN0IHsgdXR0ZXJhbmNlSWQsIHRleHQsIHN0YXR1cyB9ID0gYWN0aW9uLnBheWxvYWQgfHwge307XHJcbiAgICAgIGlmICghdXR0ZXJhbmNlSWQpIHJldHVybjtcclxuICAgICAgZm9yIChsZXQgaSA9IHN0YXRlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XHJcbiAgICAgICAgaWYgKHN0YXRlW2ldLnR5cGUgPT09IFwicXVlc3Rpb25cIiAmJiBzdGF0ZVtpXS51dHRlcmFuY2VJZCA9PT0gdXR0ZXJhbmNlSWQpIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgdGV4dCA9PT0gXCJzdHJpbmdcIikgc3RhdGVbaV0udGV4dCA9IHRleHQ7XHJcbiAgICAgICAgICBpZiAoc3RhdHVzKSBzdGF0ZVtpXS5zdGF0dXMgPSBzdGF0dXM7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHsgYWRkVG9IaXN0b3J5LCBjbGVhckhpc3RvcnksIHVwZGF0ZUxhdGVzdFF1ZXN0aW9uIH0gPSBoaXN0b3J5U2xpY2UuYWN0aW9ucztcclxuZXhwb3J0IGRlZmF1bHQgaGlzdG9yeVNsaWNlLnJlZHVjZXI7XHJcbiJdLCJuYW1lcyI6WyJjcmVhdGVTbGljZSIsImhpc3RvcnlTbGljZSIsIm5hbWUiLCJpbml0aWFsU3RhdGUiLCJyZWR1Y2VycyIsImFkZFRvSGlzdG9yeSIsInN0YXRlIiwiYWN0aW9uIiwicHVzaCIsInBheWxvYWQiLCJjbGVhckhpc3RvcnkiLCJ1cGRhdGVMYXRlc3RRdWVzdGlvbiIsInV0dGVyYW5jZUlkIiwidGV4dCIsInN0YXR1cyIsImkiLCJsZW5ndGgiLCJ0eXBlIiwiYWN0aW9ucyIsInJlZHVjZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./redux/historySlice.js\n");

/***/ }),

/***/ "./redux/transcriptionSlice.js":
/*!*************************************!*\
  !*** ./redux/transcriptionSlice.js ***!
  \*************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   clearTranscription: () => (/* binding */ clearTranscription),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   setTranscription: () => (/* binding */ setTranscription)\n/* harmony export */ });\n/* harmony import */ var _reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @reduxjs/toolkit */ \"@reduxjs/toolkit\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__]);\n_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\nconst transcriptionSlice = (0,_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__.createSlice)({\n    name: 'transcription',\n    initialState: '',\n    reducers: {\n        setTranscription: (state, action)=>action.payload,\n        clearTranscription: ()=>''\n    }\n});\nconst { setTranscription, clearTranscription } = transcriptionSlice.actions;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (transcriptionSlice.reducer);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9yZWR1eC90cmFuc2NyaXB0aW9uU2xpY2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUErQztBQUUvQyxNQUFNQyxxQkFBcUJELDZEQUFXQSxDQUFDO0lBQ3JDRSxNQUFNO0lBQ05DLGNBQWM7SUFDZEMsVUFBVTtRQUNSQyxrQkFBa0IsQ0FBQ0MsT0FBT0MsU0FBV0EsT0FBT0MsT0FBTztRQUNuREMsb0JBQW9CLElBQU07SUFDNUI7QUFDRjtBQUVPLE1BQU0sRUFBRUosZ0JBQWdCLEVBQUVJLGtCQUFrQixFQUFFLEdBQUdSLG1CQUFtQlMsT0FBTyxDQUFDO0FBQ25GLGlFQUFlVCxtQkFBbUJVLE9BQU8sRUFBQyIsInNvdXJjZXMiOlsiRDpcXE15IFByb2plY3RzXFxJbnRlcnZpZXdDb3BpbG90XFxyZWR1eFxcdHJhbnNjcmlwdGlvblNsaWNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVNsaWNlIH0gZnJvbSAnQHJlZHV4anMvdG9vbGtpdCc7XHJcblxyXG5jb25zdCB0cmFuc2NyaXB0aW9uU2xpY2UgPSBjcmVhdGVTbGljZSh7XHJcbiAgbmFtZTogJ3RyYW5zY3JpcHRpb24nLFxyXG4gIGluaXRpYWxTdGF0ZTogJycsXHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIHNldFRyYW5zY3JpcHRpb246IChzdGF0ZSwgYWN0aW9uKSA9PiBhY3Rpb24ucGF5bG9hZCxcclxuICAgIGNsZWFyVHJhbnNjcmlwdGlvbjogKCkgPT4gJydcclxuICB9LFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCB7IHNldFRyYW5zY3JpcHRpb24sIGNsZWFyVHJhbnNjcmlwdGlvbiB9ID0gdHJhbnNjcmlwdGlvblNsaWNlLmFjdGlvbnM7XHJcbmV4cG9ydCBkZWZhdWx0IHRyYW5zY3JpcHRpb25TbGljZS5yZWR1Y2VyO1xyXG4iXSwibmFtZXMiOlsiY3JlYXRlU2xpY2UiLCJ0cmFuc2NyaXB0aW9uU2xpY2UiLCJuYW1lIiwiaW5pdGlhbFN0YXRlIiwicmVkdWNlcnMiLCJzZXRUcmFuc2NyaXB0aW9uIiwic3RhdGUiLCJhY3Rpb24iLCJwYXlsb2FkIiwiY2xlYXJUcmFuc2NyaXB0aW9uIiwiYWN0aW9ucyIsInJlZHVjZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./redux/transcriptionSlice.js\n");

/***/ }),

/***/ "./store.js":
/*!******************!*\
  !*** ./store.js ***!
  \******************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @reduxjs/toolkit */ \"@reduxjs/toolkit\");\n/* harmony import */ var _reducers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reducers */ \"./reducers.js\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__, _reducers__WEBPACK_IMPORTED_MODULE_1__]);\n([_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__, _reducers__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\nconst store = (0,_reduxjs_toolkit__WEBPACK_IMPORTED_MODULE_0__.configureStore)({\n    reducer: _reducers__WEBPACK_IMPORTED_MODULE_1__[\"default\"]\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (store);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zdG9yZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBa0Q7QUFDYjtBQUVyQyxNQUFNRSxRQUFRRixnRUFBY0EsQ0FBQztJQUMzQkcsU0FBU0YsaURBQVdBO0FBQ3RCO0FBRUEsaUVBQWVDLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIkQ6XFxNeSBQcm9qZWN0c1xcSW50ZXJ2aWV3Q29waWxvdFxcc3RvcmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY29uZmlndXJlU3RvcmUgfSBmcm9tICdAcmVkdXhqcy90b29sa2l0JztcbmltcG9ydCByb290UmVkdWNlciBmcm9tICcuL3JlZHVjZXJzJztcblxuY29uc3Qgc3RvcmUgPSBjb25maWd1cmVTdG9yZSh7XG4gIHJlZHVjZXI6IHJvb3RSZWR1Y2VyLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHN0b3JlO1xuIl0sIm5hbWVzIjpbImNvbmZpZ3VyZVN0b3JlIiwicm9vdFJlZHVjZXIiLCJzdG9yZSIsInJlZHVjZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./store.js\n");

/***/ }),

/***/ "./theme.js":
/*!******************!*\
  !*** ./theme.js ***!
  \******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   darkTheme: () => (/* binding */ darkTheme),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mui/material/styles */ \"./node_modules/@mui/material/node/styles/index.js\");\n/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material/colors */ \"./node_modules/@mui/material/node/colors/index.js\");\n\n\n// Create a theme instance.\nconst theme = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__.createTheme)({\n    palette: {\n        primary: {\n            main: '#1976d2',\n            light: '#42a5f5',\n            dark: '#1565c0',\n            contrastText: '#ffffff'\n        },\n        secondary: {\n            main: '#dc004e',\n            light: '#ff4081',\n            dark: '#9a0036',\n            contrastText: '#ffffff'\n        },\n        error: {\n            main: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.red.A400\n        },\n        background: {\n            default: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[100],\n            paper: '#ffffff'\n        },\n        text: {\n            primary: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[900],\n            secondary: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[700]\n        }\n    },\n    typography: {\n        fontFamily: '\"Roboto\", \"Helvetica\", \"Arial\", sans-serif',\n        h4: {\n            fontWeight: 700,\n            color: '#333333',\n            marginBottom: '0.75em'\n        },\n        h5: {\n            fontWeight: 600,\n            color: '#444444',\n            marginBottom: '0.5em'\n        },\n        h6: {\n            fontWeight: 600,\n            color: '#555555',\n            marginBottom: '0.5em'\n        },\n        button: {\n            textTransform: 'none',\n            fontWeight: 500,\n            letterSpacing: '0.5px'\n        },\n        body1: {\n            lineHeight: 1.6\n        },\n        caption: {\n            color: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[600]\n        }\n    },\n    shape: {\n        borderRadius: 8\n    },\n    components: {\n        MuiPaper: {\n            styleOverrides: {\n                root: {\n                    boxShadow: '0px 5px 15px rgba(0,0,0,0.08)'\n                }\n            }\n        },\n        MuiButton: {\n            styleOverrides: {\n                root: {\n                    padding: '10px 20px',\n                    boxShadow: 'none',\n                    '&:hover': {\n                        boxShadow: '0px 2px 8px rgba(0,0,0,0.1)'\n                    }\n                },\n                containedPrimary: {\n                    '&:hover': {\n                        backgroundColor: '#1565c0'\n                    }\n                },\n                containedSecondary: {\n                    '&:hover': {\n                        backgroundColor: '#9a0036'\n                    }\n                }\n            }\n        },\n        MuiTextField: {\n            styleOverrides: {\n                root: {\n                    '& .MuiOutlinedInput-root': {\n                        '&:hover fieldset': {\n                            borderColor: '#1976d2'\n                        }\n                    },\n                    '& .MuiInputLabel-root.Mui-focused': {\n                        color: '#1976d2'\n                    }\n                }\n            }\n        },\n        MuiIconButton: {\n            styleOverrides: {\n                root: {\n                    '&:hover': {\n                        backgroundColor: 'rgba(255, 255, 255, 0.08)'\n                    }\n                }\n            }\n        },\n        MuiChip: {\n            styleOverrides: {\n                root: {\n                    fontWeight: 500\n                }\n            }\n        },\n        MuiAppBar: {\n            styleOverrides: {\n                root: {\n                    boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.03)'\n                }\n            }\n        },\n        MuiList: {\n            styleOverrides: {\n                root: {\n                    '& .MuiListItem-root': {\n                        borderRadius: 8\n                    }\n                }\n            }\n        }\n    }\n});\nconst darkTheme = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__.createTheme)(theme, {\n    palette: {\n        mode: 'dark',\n        primary: {\n            main: '#42a5f5',\n            light: '#80d6ff',\n            dark: '#0077c2',\n            contrastText: '#0a0a0a'\n        },\n        secondary: {\n            main: '#ff4081',\n            light: '#ff79b0',\n            dark: '#c60055',\n            contrastText: '#0a0a0a'\n        },\n        background: {\n            default: '#121212',\n            paper: '#1e1e1e'\n        },\n        text: {\n            primary: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[100],\n            secondary: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[400]\n        }\n    },\n    typography: {\n        h4: {\n            color: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[100]\n        },\n        h5: {\n            color: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[200]\n        },\n        h6: {\n            color: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[300]\n        },\n        caption: {\n            color: _mui_material_colors__WEBPACK_IMPORTED_MODULE_1__.grey[500]\n        }\n    }\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (darkTheme);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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VkUsSUFBSTtZQUFFRSxPQUFPbkIsc0RBQUksQ0FBQyxJQUFJO1FBQUM7UUFDdkJxQixJQUFJO1lBQUVGLE9BQU9uQixzREFBSSxDQUFDLElBQUk7UUFBQztRQUN2QnNCLElBQUk7WUFBRUgsT0FBT25CLHNEQUFJLENBQUMsSUFBSTtRQUFDO1FBQ3ZCNEIsU0FBUztZQUFFVCxPQUFPbkIsc0RBQUksQ0FBQyxJQUFJO1FBQUM7SUFDOUI7QUFDRixHQUFHO0FBRUgsaUVBQWUrQyxTQUFTQSxFQUFDIiwic291cmNlcyI6WyJEOlxcTXkgUHJvamVjdHNcXEludGVydmlld0NvcGlsb3RcXHRoZW1lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVRoZW1lIH0gZnJvbSAnQG11aS9tYXRlcmlhbC9zdHlsZXMnO1xuaW1wb3J0IHsgcmVkLCBncmV5IH0gZnJvbSAnQG11aS9tYXRlcmlhbC9jb2xvcnMnO1xuXG4vLyBDcmVhdGUgYSB0aGVtZSBpbnN0YW5jZS5cbmNvbnN0IHRoZW1lID0gY3JlYXRlVGhlbWUoe1xuICBwYWxldHRlOiB7XG4gICAgcHJpbWFyeToge1xuICAgICAgbWFpbjogJyMxOTc2ZDInLFxuICAgICAgbGlnaHQ6ICcjNDJhNWY1JyxcbiAgICAgIGRhcms6ICcjMTU2NWMwJyxcbiAgICAgIGNvbnRyYXN0VGV4dDogJyNmZmZmZmYnLFxuICAgIH0sXG4gICAgc2Vjb25kYXJ5OiB7XG4gICAgICBtYWluOiAnI2RjMDA0ZScsXG4gICAgICBsaWdodDogJyNmZjQwODEnLFxuICAgICAgZGFyazogJyM5YTAwMzYnLFxuICAgICAgY29udHJhc3RUZXh0OiAnI2ZmZmZmZicsXG4gICAgfSxcbiAgICBlcnJvcjoge1xuICAgICAgbWFpbjogcmVkLkE0MDAsXG4gICAgfSxcbiAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICBkZWZhdWx0OiBncmV5WzEwMF0sXG4gICAgICBwYXBlcjogJyNmZmZmZmYnLFxuICAgIH0sXG4gICAgdGV4dDoge1xuICAgICAgcHJpbWFyeTogZ3JleVs5MDBdLFxuICAgICAgc2Vjb25kYXJ5OiBncmV5WzcwMF0sXG4gICAgfVxuICB9LFxuICB0eXBvZ3JhcGh5OiB7XG4gICAgZm9udEZhbWlseTogJ1wiUm9ib3RvXCIsIFwiSGVsdmV0aWNhXCIsIFwiQXJpYWxcIiwgc2Fucy1zZXJpZicsXG4gICAgaDQ6IHtcbiAgICAgIGZvbnRXZWlnaHQ6IDcwMCxcbiAgICAgIGNvbG9yOiAnIzMzMzMzMycsXG4gICAgICBtYXJnaW5Cb3R0b206ICcwLjc1ZW0nLFxuICAgIH0sXG4gICAgaDU6IHtcbiAgICAgIGZvbnRXZWlnaHQ6IDYwMCxcbiAgICAgIGNvbG9yOiAnIzQ0NDQ0NCcsXG4gICAgICBtYXJnaW5Cb3R0b206ICcwLjVlbScsXG4gICAgfSxcbiAgICBoNjoge1xuICAgICAgZm9udFdlaWdodDogNjAwLFxuICAgICAgY29sb3I6ICcjNTU1NTU1JyxcbiAgICAgIG1hcmdpbkJvdHRvbTogJzAuNWVtJyxcbiAgICB9LFxuICAgIGJ1dHRvbjoge1xuICAgICAgdGV4dFRyYW5zZm9ybTogJ25vbmUnLFxuICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgbGV0dGVyU3BhY2luZzogJzAuNXB4JyxcbiAgICB9LFxuICAgIGJvZHkxOiB7XG4gICAgICBsaW5lSGVpZ2h0OiAxLjYsXG4gICAgfSxcbiAgICBjYXB0aW9uOiB7XG4gICAgICBjb2xvcjogZ3JleVs2MDBdLFxuICAgIH1cbiAgfSxcbiAgc2hhcGU6IHtcbiAgICBib3JkZXJSYWRpdXM6IDgsXG4gIH0sXG4gIGNvbXBvbmVudHM6IHtcbiAgICBNdWlQYXBlcjoge1xuICAgICAgc3R5bGVPdmVycmlkZXM6IHtcbiAgICAgICAgcm9vdDoge1xuICAgICAgICAgIGJveFNoYWRvdzogJzBweCA1cHggMTVweCByZ2JhKDAsMCwwLDAuMDgpJyxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgTXVpQnV0dG9uOiB7XG4gICAgICBzdHlsZU92ZXJyaWRlczoge1xuICAgICAgICByb290OiB7XG4gICAgICAgICAgcGFkZGluZzogJzEwcHggMjBweCcsXG4gICAgICAgICAgYm94U2hhZG93OiAnbm9uZScsXG4gICAgICAgICAgJyY6aG92ZXInOiB7XG4gICAgICAgICAgICBib3hTaGFkb3c6ICcwcHggMnB4IDhweCByZ2JhKDAsMCwwLDAuMSknLFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29udGFpbmVkUHJpbWFyeToge1xuICAgICAgICAgICcmOmhvdmVyJzoge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzE1NjVjMCcsXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb250YWluZWRTZWNvbmRhcnk6IHtcbiAgICAgICAgICAnJjpob3Zlcic6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyM5YTAwMzYnLFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9LFxuICAgIE11aVRleHRGaWVsZDoge1xuICAgICAgc3R5bGVPdmVycmlkZXM6IHtcbiAgICAgICAgcm9vdDoge1xuICAgICAgICAgICcmIC5NdWlPdXRsaW5lZElucHV0LXJvb3QnOiB7XG4gICAgICAgICAgICAnJjpob3ZlciBmaWVsZHNldCc6IHtcbiAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjMTk3NmQyJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnJiAuTXVpSW5wdXRMYWJlbC1yb290Lk11aS1mb2N1c2VkJzoge1xuICAgICAgICAgICAgY29sb3I6ICcjMTk3NmQyJyxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIE11aUljb25CdXR0b246IHtcbiAgICAgIHN0eWxlT3ZlcnJpZGVzOiB7XG4gICAgICAgIHJvb3Q6IHtcbiAgICAgICAgICAnJjpob3Zlcic6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCknXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBNdWlDaGlwOiB7XG4gICAgICBzdHlsZU92ZXJyaWRlczoge1xuICAgICAgICByb290OiB7XG4gICAgICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBNdWlBcHBCYXI6IHtcbiAgICAgICAgc3R5bGVPdmVycmlkZXM6IHtcbiAgICAgICAgICAgIHJvb3Q6IHtcbiAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwcHggMnB4IDRweCAtMXB4IHJnYmEoMCwwLDAsMC4wNiksIDBweCA0cHggNXB4IDBweCByZ2JhKDAsMCwwLDAuMDQpLCAwcHggMXB4IDEwcHggMHB4IHJnYmEoMCwwLDAsMC4wMyknLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBNdWlMaXN0OiB7XG4gICAgICAgIHN0eWxlT3ZlcnJpZGVzOiB7XG4gICAgICAgICAgICByb290OiB7XG4gICAgICAgICAgICAgICAgJyYgLk11aUxpc3RJdGVtLXJvb3QnOiB7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuXG5leHBvcnQgY29uc3QgZGFya1RoZW1lID0gY3JlYXRlVGhlbWUodGhlbWUsIHtcbiAgcGFsZXR0ZToge1xuICAgIG1vZGU6ICdkYXJrJyxcbiAgICBwcmltYXJ5OiB7XG4gICAgICBtYWluOiAnIzQyYTVmNScsXG4gICAgICBsaWdodDogJyM4MGQ2ZmYnLFxuICAgICAgZGFyazogJyMwMDc3YzInLFxuICAgICAgY29udHJhc3RUZXh0OiAnIzBhMGEwYScsXG4gICAgfSxcbiAgICBzZWNvbmRhcnk6IHtcbiAgICAgIG1haW46ICcjZmY0MDgxJyxcbiAgICAgIGxpZ2h0OiAnI2ZmNzliMCcsXG4gICAgICBkYXJrOiAnI2M2MDA1NScsXG4gICAgICBjb250cmFzdFRleHQ6ICcjMGEwYTBhJyxcbiAgICB9LFxuICAgIGJhY2tncm91bmQ6IHtcbiAgICAgIGRlZmF1bHQ6ICcjMTIxMjEyJyxcbiAgICAgIHBhcGVyOiAnIzFlMWUxZScsXG4gICAgfSxcbiAgICB0ZXh0OiB7XG4gICAgICBwcmltYXJ5OiBncmV5WzEwMF0sXG4gICAgICBzZWNvbmRhcnk6IGdyZXlbNDAwXSxcbiAgICB9LFxuICB9LFxuICB0eXBvZ3JhcGh5OiB7XG4gICAgaDQ6IHsgY29sb3I6IGdyZXlbMTAwXSB9LFxuICAgIGg1OiB7IGNvbG9yOiBncmV5WzIwMF0gfSxcbiAgICBoNjogeyBjb2xvcjogZ3JleVszMDBdIH0sXG4gICAgY2FwdGlvbjogeyBjb2xvcjogZ3JleVs1MDBdIH0sXG4gIH0sXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZGFya1RoZW1lOyJdLCJuYW1lcyI6WyJjcmVhdGVUaGVtZSIsInJlZCIsImdyZXkiLCJ0aGVtZSIsInBhbGV0dGUiLCJwcmltYXJ5IiwibWFpbiIsImxpZ2h0IiwiZGFyayIsImNvbnRyYXN0VGV4dCIsInNlY29uZGFyeSIsImVycm9yIiwiQTQwMCIsImJhY2tncm91bmQiLCJkZWZhdWx0IiwicGFwZXIiLCJ0ZXh0IiwidHlwb2dyYXBoeSIsImZvbnRGYW1pbHkiLCJoNCIsImZvbnRXZWlnaHQiLCJjb2xvciIsIm1hcmdpbkJvdHRvbSIsImg1IiwiaDYiLCJidXR0b24iLCJ0ZXh0VHJhbnNmb3JtIiwibGV0dGVyU3BhY2luZyIsImJvZHkxIiwibGluZUhlaWdodCIsImNhcHRpb24iLCJzaGFwZSIsImJvcmRlclJhZGl1cyIsImNvbXBvbmVudHMiLCJNdWlQYXBlciIsInN0eWxlT3ZlcnJpZGVzIiwicm9vdCIsImJveFNoYWRvdyIsIk11aUJ1dHRvbiIsInBhZGRpbmciLCJjb250YWluZWRQcmltYXJ5IiwiYmFja2dyb3VuZENvbG9yIiwiY29udGFpbmVkU2Vjb25kYXJ5IiwiTXVpVGV4dEZpZWxkIiwiYm9yZGVyQ29sb3IiLCJNdWlJY29uQnV0dG9uIiwiTXVpQ2hpcCIsIk11aUFwcEJhciIsIk11aUxpc3QiLCJkYXJrVGhlbWUiLCJtb2RlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./theme.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "@mui/system":
/*!******************************!*\
  !*** external "@mui/system" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system");

/***/ }),

/***/ "@mui/system/DefaultPropsProvider":
/*!***************************************************!*\
  !*** external "@mui/system/DefaultPropsProvider" ***!
  \***************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/DefaultPropsProvider");

/***/ }),

/***/ "@mui/system/InitColorSchemeScript":
/*!****************************************************!*\
  !*** external "@mui/system/InitColorSchemeScript" ***!
  \****************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/InitColorSchemeScript");

/***/ }),

/***/ "@mui/system/colorManipulator":
/*!***********************************************!*\
  !*** external "@mui/system/colorManipulator" ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/colorManipulator");

/***/ }),

/***/ "@mui/system/createBreakpoints":
/*!************************************************!*\
  !*** external "@mui/system/createBreakpoints" ***!
  \************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/createBreakpoints");

/***/ }),

/***/ "@mui/system/createStyled":
/*!*******************************************!*\
  !*** external "@mui/system/createStyled" ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/createStyled");

/***/ }),

/***/ "@mui/system/createTheme":
/*!******************************************!*\
  !*** external "@mui/system/createTheme" ***!
  \******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/createTheme");

/***/ }),

/***/ "@mui/system/cssVars":
/*!**************************************!*\
  !*** external "@mui/system/cssVars" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/cssVars");

/***/ }),

/***/ "@mui/system/spacing":
/*!**************************************!*\
  !*** external "@mui/system/spacing" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/spacing");

/***/ }),

/***/ "@mui/system/styleFunctionSx":
/*!**********************************************!*\
  !*** external "@mui/system/styleFunctionSx" ***!
  \**********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/styleFunctionSx");

/***/ }),

/***/ "@mui/system/useThemeProps":
/*!********************************************!*\
  !*** external "@mui/system/useThemeProps" ***!
  \********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/system/useThemeProps");

/***/ }),

/***/ "@mui/utils/deepmerge":
/*!***************************************!*\
  !*** external "@mui/utils/deepmerge" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/utils/deepmerge");

/***/ }),

/***/ "@mui/utils/formatMuiErrorMessage":
/*!***************************************************!*\
  !*** external "@mui/utils/formatMuiErrorMessage" ***!
  \***************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/utils/formatMuiErrorMessage");

/***/ }),

/***/ "@mui/utils/generateUtilityClass":
/*!**************************************************!*\
  !*** external "@mui/utils/generateUtilityClass" ***!
  \**************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mui/utils/generateUtilityClass");

/***/ }),

/***/ "prop-types":
/*!*****************************!*\
  !*** external "prop-types" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("prop-types");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "@reduxjs/toolkit":
/*!***********************************!*\
  !*** external "@reduxjs/toolkit" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = import("@reduxjs/toolkit");;

/***/ }),

/***/ "react-redux":
/*!******************************!*\
  !*** external "react-redux" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = import("react-redux");;

/***/ }),

/***/ "redux":
/*!************************!*\
  !*** external "redux" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = import("redux");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/@mui","vendor-chunks/@babel"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();