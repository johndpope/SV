import { EventEmitter } from "@angular/core";
import { iFile } from "./FileWrapper.service";
export declare class FilesStore {
    filesUpdated: EventEmitter<{}>;
    startAutoUploading: any;
    beforeAddFile: any;
    private WSfiles;
    private _iFiles;
    readonly files: Array<File>;
    iFiles: iFile[];
    addFiles(files: any): void;
    removeFiles(iFile: iFile): void;
    clearStore(): void;
}
