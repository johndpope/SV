import {Injectable} from '@angular/core';
import {cjList, lsLists, foLists} from '../sidebar/midList.metadata';

@Injectable()
export class MidService {
    constructor() {}

    getLS(domain:string) {
        let mid;
        domain = this.extractDomain(domain);
        mid = lsLists.find((mid) => {return mid['dom'] == domain});
        return typeof mid != 'object' ? null : mid['mid'];
    }

    getCJ(domain:string) {
        let mid;
        domain = this.extractDomain(domain);
        mid = cjList.find((mid) => {return mid == domain});
        return typeof mid != 'string' ? null : "cj";
    }

    getFO(domain:string) {
        let mid;
        domain = this.extractDomain(domain);
        mid = lsLists.find((mid) => {return mid['dom'] == domain});
        return typeof mid != 'object' ? null : mid['advertiserId'];
    }

    extractDomain(url:string):string {
        let domain;
        if(url.indexOf('://') > -1) {
            domain = url.split('/')[2];
        } else {
            domain = url.split('/')[0];
        }

        domain = domain.split(':')[0];
        domain = domain.replace('www.','');
        return domain;
    }
}