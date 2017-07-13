import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import {LoopBackConfig} from '../shared/sdk';
/**
* This class provides the Member service with methods to read names and add names.
*/
@Injectable()
export class MemberService {
/**
* Creates a new MemberService with the injected Http.
* @param {Http} http - The injected Http.
* @constructor
*/
    constructor(private http: Http) {}

/**
 * Logout User using header with
 */

    getSetting():Observable<any> {
        let headers = new Headers({'Authorization': localStorage.getItem('accessToken')});
        let options = new RequestOptions({headers: headers})
        let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Settings";
        return this.http.post(_url, {}, options)
                .map((res: Response) => res.json())
                .catch((error: any) => Observable.throw(error.json()))
    }

    

}