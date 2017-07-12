import { EventEmitter } from '@angular/core';
export declare class File {
    ext: string;
    previewSrc: string;
    fileName: string;
    previewHeight: number;
    ngAfterContentInit(): void;
    file: any;
    index: any;
    percentage: any;
    loadingSuccessful: any;
    responseMessage: any;
    removeFile: EventEmitter<{}>;
    removeFileListener(e: any): void;
    getFileType(): void;
}
