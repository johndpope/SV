import { FileUpload } from "./FileUpload.service";
export interface iFile {
    File: File;
    removing: boolean;
    loading: boolean;
    percentage: number;
    id: string;
    loadingSuccessful: boolean;
    fileUploaded: any;
    responseMessage: string;
    uploader: FileUpload;
}
export declare class FileWrapper {
    File: any;
    loading: boolean;
    percentage: number;
    removing: boolean;
    responseMessage: string;
    id: string;
    loadingSuccessful: boolean;
    uploader: any;
    constructor(file: any);
}
