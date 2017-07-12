"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var import0 = require("@angular/core");
var import1 = require("./daterangepicker.module");
var import2 = require("./config.service");
var DaterangepickerInjector = (function (_super) {
    __extends(DaterangepickerInjector, _super);
    function DaterangepickerInjector(parent) {
        return _super.call(this, parent, [], []) || this;
    }
    Object.defineProperty(DaterangepickerInjector.prototype, "_DaterangepickerConfig_1", {
        get: function () {
            if ((this.__DaterangepickerConfig_1 == null)) {
                (this.__DaterangepickerConfig_1 = new import2.DaterangepickerConfig());
            }
            return this.__DaterangepickerConfig_1;
        },
        enumerable: true,
        configurable: true
    });
    DaterangepickerInjector.prototype.createInternal = function () {
        this._Daterangepicker_0 = new import1.Daterangepicker();
        return this._Daterangepicker_0;
    };
    DaterangepickerInjector.prototype.getInternal = function (token, notFoundResult) {
        if ((token === import1.Daterangepicker)) {
            return this._Daterangepicker_0;
        }
        if ((token === import2.DaterangepickerConfig)) {
            return this._DaterangepickerConfig_1;
        }
        return notFoundResult;
    };
    DaterangepickerInjector.prototype.destroyInternal = function () {
    };
    return DaterangepickerInjector;
}(import0.ɵNgModuleInjector));
exports.DaterangepickerNgFactory = new import0.NgModuleFactory(DaterangepickerInjector, import1.Daterangepicker);
//# sourceMappingURL=daterangepicker.module.ngfactory.js.map