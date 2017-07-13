import {Pipe, PipeTransform} from '@angular/core';

/**
 * Format number to right price
 * Usage:
 *  value | toFixed: number
 * Example:
 *  {{ 2 | toFixed: 2}}
 *  formats to: 2.00
 * 
 *  {{ 2.2163 | toFixed: 2 }}
 *  formats to: 2.22
 */
@Pipe({name:'toFixed'})
export class ToFixedPipe implements PipeTransform {
    transform(value: any, fixed: number = 2): string {
        return parseFloat(value).toFixed(fixed)
    }
}