## Angular2 (ng2) Files droppable area including list of files which could be managed before upload

#### Installation:

```
npm install --save file-droppa
```

#### Demo:
![Screenshot](https://raw.githubusercontent.com/ptkach/fileDroppa/master/demo_fileDroppa.gif)

#### Usage:

**Import FileDroppa and use it as a directive:**

```
import FileDroppa from 'file-droppa'

@Component({
    selector: 'my-app',
    directives: [FileDroppa],
    template: `<fileDroppa [url]="'https://salty-taiga-80701.herokuapp.com/upload'">
                   <!--<h1>-->
                        <!--You can pass anything you want here-->
                        <!--You can set you own file list here-->
                   <!--</h1>-->
               </fileDroppa>`
})
export class AppComponent {}
```

#### Configuration:

| Parameter        | Required   | Description  |
| ------------- |:-------------:| -----:|
| [url]         | Yes           | Provides Url to make Post Request |
| [autoUpload]      | No  | If true, files will be automatically uploaded once selected or dropped |
| [showFilesList] |  No    | If false files list will be hidden |
| [beforeRequest] | No    | Callback which is called before File will be posted to server. Good chance to set requestHeader or update XHR request |
| [beforeFileUpload] | No  | Callback which is called before specific file is uploaded, called with formData object. Can be used to update formData file name for example |
| [beforeAddFile] | No  | Callback which is called once you drop or select file and before file is added to fileDroppa file store. Can be used to validate file for example by it's type or size. |
| [dropZoneTemplate] | No | Can be used to override drop area template |
| (filesUpdated) | No | Callback which will be fired once any file was added or removed with state of files after update |
| (fileUploaded) | No | Callback which will be fired once any file was uploaded. With operation success, server response and file object |

#### Example:

```
@Component({
    selector: 'my-app',
    directives: [FileDroppa],
    template: `<fileDroppa
                    [url]="'https://salty-taiga-80701.herokuapp.com/upload2'"
                    [autoUpload]="false"
                    [showFilesList]="true"
                    [beforeRequest]="beforeRequest"
                    [beforeFileUpload]="beforeFileUpload"
                    [beforeAddFile]="beforeAddFile"
                    (filesUpdated)="filesUpdated($event)"
                    (fileUploaded)="fileUploaded($event)"
               >
               <!--<h1>-->
                    <!--You can pass anything you want here-->
                    <!--You can set you own file list here-->
               <!--</h1>-->
               </fileDroppa>`
})
export class AppComponent {
    /**
     * You can override default dropZone area template with [dropZoneTemplate] parameter passed to fileDroppa component
     */
    //public dropZoneTemplate = `
    //    <div class="awesome_override_xxx">Here I'm overriding library template</div>
    //`;
    /**
     * EVENTS
     */
    fileUploaded(success, response, file){
        success && console.log("uploaded - awesome", response, file);
        success || console.log("not uploaded - very bad", response, file);
    }

    filesUpdated(files) {
        console.log("Store state updated! Current state: ", files)
    }

    /**
     * CALLBACKS
     */

    /**
     * This method is called before Request happened
     * You can modify xhr confoguration in it
     * requestHeaders for example
     *
     * @param xhr
     */
    beforeRequest(xhr){
        xhr.setRequestHeader("Hello","World");
    }

    /**
     * This method allows you to make validation before file is sent
     * You can update fileName for example
     * Or you can return null and file won't be send
     *
     * @param formData
     * @returns formData or null
     */
    beforeFileUpload(formData){
        return formData;
    }

    /**
     * This method is called once your drop or select files
     * You can validate and decline or accept file
     *
     * @param file
     * @returns Boolean
     */
    beforeAddFile(file){
        return true;
    }
}
```

### Contributors
Contributions are very welcomed.
If you want to help us, please fork this repo from [ptkach/fileDroppa](ptkach/fileDroppa) and create pull request after adding some code.
