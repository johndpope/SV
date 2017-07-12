import { FilesStore } from "../Services/FileStore.service";
import { iFile } from "../Services/FileWrapper.service";
export declare class FileList {
    filesStore: FilesStore;
    constructor(filesStore: FilesStore);
    removeFile(iFile: iFile): void;
}
