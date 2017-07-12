import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import {LoopBackConfig} from '../shared/sdk';

@Injectable()
export class UploadService {
        progress: number;
        progressObserver: any;
        progress$: any;
    constructor(private http: Http) {
        this.progress = 0;
        this.progress$ = new Observable(observer => {
            this.progressObserver = observer
        });
    }

    public upload(formData: FormData): Observable<any> {
      return Observable.create(observer => {  
        let xhr: XMLHttpRequest = new XMLHttpRequest();
        let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
        "/Uploads/upload";
        let that = this;
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    observer.next(JSON.parse(xhr.response));
                    observer.complete();
                } else {
                    observer.error(xhr.response);
                }
            } else {
                if(xhr.readyState == 1) {
                    this.progress = Math.floor((Math.random() * 25));
                    this.progressObserver.next(this.progress);
                } else if(xhr.readyState == 2) {
                    setTimeout(() => {
                        this.progress = Math.floor((Math.random() * 25) + 25);
                        this.progressObserver.next(this.progress);
                    }, 30);
                } else {
                    setTimeout(() => {
                        this.progress = Math.floor((Math.random() * 25) + 50);
                        this.progressObserver.next(this.progress);
                    }, 70);
                }
                
            }
            
        };
        xhr.open('POST', _url, true);
        xhr.setRequestHeader("Authorization", localStorage.getItem('accessToken'));
        xhr.onprogress = function (e) {
            if (e.lengthComputable) {
                setTimeout(() => {
                        that.progressObserver.next(100);
                }, 100);
            }
        }
        xhr.send(formData);
      });
    }
}

