import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router, Params} from '@angular/router';
import {LoopBackConfig, MemberApi} from '../shared/sdk/index';
import {API_VERSION, BASE_URL} from '../shared/base.url';

@Component({
  selector: 'activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.css']
})
export class ActivateAccountComponent implements OnInit {
  public msg: string = " FAILED: Invalid activate URL.";
  public className: string = "alert-danger";

  constructor(private route:ActivatedRoute,private memberApi: MemberApi) {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }

  ngOnInit() {
    let me = this;
    this.route.queryParams.subscribe(params => {
      if (!params) {
        return ;
      }

      let uid = params['uid'] || false;
      let token = params['token'] || false;
      if (!uid || !token) {
        return ;
      }

      this.memberApi.confirm(uid, token).subscribe(data => {
        if (data['error']) {
          me.msg = "FAILED: " + data['error']['message'] + " (" + data['error']['code'] + ")";
          return ;
        }
        me.msg = "Your account is activated successfully.";
        me.className = "alert-success";
      });
    });
  }
}
