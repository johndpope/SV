import { EventEmitter } from "@angular/core";
export declare class FileUpload {
    private zone;
    url: any;
    beforeRequest: any;
    beforeFileUpload: any;
    fileUploadedEvent: EventEmitter<{}>;
    uploadFiles(iFiles: any): Promise<{}[]>;
    uploadFile(iFile: any): Promise<void>;
}
