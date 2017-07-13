import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LoopBackConfig } from '../shared/sdk/index';
import { API_VERSION, BASE_URL } from '../shared';
import { Member, AccessToken } from '../shared/sdk/models';
import { MemberApi, LoopBackAuth } from '../shared/sdk/services';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private member: Member = new Member();
  private errorMsg: string;
  constructor(private memberApi: MemberApi, private router: Router, private _authService: LoopBackAuth) {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }

  ngOnInit() {
    if (localStorage.getItem('accessToken') !== null) {
      this.router.navigate([''])
    } else {
      localStorage.clear();
      if (sessionStorage.getItem('lockString') == null) {
        this.router.navigate(['lock']);
      }
    }
  }

  private logIn(): void {

    var $btn = $("#btnLogin").button('loading')
    this.memberApi.processLogin(this.member, "user").subscribe(
      (token: any) => {
        $btn.button('reset');
        if (token.data) {
          let user = token.data.user;
          if (user.type && user.type.indexOf(2) > -1) {
            localStorage.setItem('accessToken', token.data.id);
            this._authService.setRememberMe(true);
            this._authService.setToken(token.data);
            this.router.navigate(['']);
          } else {
            this.showError("You must be an administrator to enter this area!!");
          }
        } else {
          this.errorMsg = token.error.message;
        }
      }
    )
  }

  private showError(message: string): void {
    $(document).ready(function () {
      $.notify({
        icon: 'pe-7s-bell',
        message: message
      }, {
          type: 'danger',
          timer: 2000,
          delay: 1000
        });
    });
  }

}
