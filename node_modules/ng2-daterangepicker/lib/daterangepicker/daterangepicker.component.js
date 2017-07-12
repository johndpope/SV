"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var config_service_1 = require("./config.service");
var $ = require("jquery");
require("bootstrap-daterangepicker");
var DaterangePickerComponent = (function () {
    function DaterangePickerComponent(input, config) {
        this.input = input;
        this.config = config;
        this.options = {};
        this.selected = new core_1.EventEmitter();
        this.cancelDaterangepicker = new core_1.EventEmitter();
        this.applyDaterangepicker = new core_1.EventEmitter();
        this.hideCalendarDaterangepicker = new core_1.EventEmitter();
        this.showCalendarDaterangepicker = new core_1.EventEmitter();
        this.hideDaterangepicker = new core_1.EventEmitter();
        this.showDaterangepicker = new core_1.EventEmitter();
    }
    DaterangePickerComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        var targetOptions = Object.assign({}, this.config.settings, this.options);
        this.config.embedCSS();
        $(this.input.nativeElement).daterangepicker(targetOptions, this.callback.bind(this));
        this.datePicker = $(this.input.nativeElement).data('daterangepicker');
        $(this.input.nativeElement).on('cancel.daterangepicker', function (e, picker) {
            var event = { event: e, picker: picker };
            _this.cancelDaterangepicker.emit(event);
        });
        $(this.input.nativeElement).on('apply.daterangepicker', function (e, picker) {
            var event = { event: e, picker: picker };
            _this.applyDaterangepicker.emit(event);
        });
        $(this.input.nativeElement).on('hideCalendar.daterangepicker', function (e, picker) {
            var event = { event: e, picker: picker };
            _this.hideCalendarDaterangepicker.emit(event);
        });
        $(this.input.nativeElement).on('showCalendar.daterangepicker', function (e, picker) {
            var event = { event: e, picker: picker };
            _this.showCalendarDaterangepicker.emit(event);
        });
        $(this.input.nativeElement).on('hide.daterangepicker', function (e, picker) {
            var event = { event: e, picker: picker };
            _this.hideDaterangepicker.emit(event);
        });
        $(this.input.nativeElement).on('show.daterangepicker', function (e, picker) {
            var event = { event: e, picker: picker };
            _this.showDaterangepicker.emit(event);
        });
    };
    DaterangePickerComponent.prototype.callback = function (start, end, label) {
        var obj = {
            start: start,
            end: end,
            label: label
        };
        this.selected.emit(obj);
    };
    DaterangePickerComponent.prototype.ngOnDestroy = function () {
        try {
            $(this.input.nativeElement).data('daterangepicker').remove();
        }
        catch (e) {
            console.log(e.message);
        }
    };
    return DaterangePickerComponent;
}());
DaterangePickerComponent.decorators = [
    { type: core_1.Directive, args: [{
                selector: '[daterangepicker]'
            },] },
];
DaterangePickerComponent.ctorParameters = function () { return [
    { type: core_1.ElementRef, },
    { type: config_service_1.DaterangepickerConfig, },
]; };
DaterangePickerComponent.propDecorators = {
    'options': [{ type: core_1.Input },],
    'selected': [{ type: core_1.Output },],
    'cancelDaterangepicker': [{ type: core_1.Output },],
    'applyDaterangepicker': [{ type: core_1.Output },],
    'hideCalendarDaterangepicker': [{ type: core_1.Output },],
    'showCalendarDaterangepicker': [{ type: core_1.Output },],
    'hideDaterangepicker': [{ type: core_1.Output },],
    'showDaterangepicker': [{ type: core_1.Output },],
};
exports.DaterangePickerComponent = DaterangePickerComponent;
//# sourceMappingURL=daterangepicker.component.js.map