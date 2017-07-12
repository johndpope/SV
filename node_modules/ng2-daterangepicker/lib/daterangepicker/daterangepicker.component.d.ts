import { AfterViewInit, EventEmitter, ElementRef, OnDestroy } from '@angular/core';
import { DaterangepickerConfig } from './config.service';
import 'bootstrap-daterangepicker';
export declare class DaterangePickerComponent implements AfterViewInit, OnDestroy {
    private input;
    private config;
    options: any;
    selected: EventEmitter<{}>;
    cancelDaterangepicker: EventEmitter<{}>;
    applyDaterangepicker: EventEmitter<{}>;
    hideCalendarDaterangepicker: EventEmitter<{}>;
    showCalendarDaterangepicker: EventEmitter<{}>;
    hideDaterangepicker: EventEmitter<{}>;
    showDaterangepicker: EventEmitter<{}>;
    datePicker: any;
    constructor(input: ElementRef, config: DaterangepickerConfig);
    ngAfterViewInit(): void;
    private callback(start?, end?, label?);
    ngOnDestroy(): void;
}
