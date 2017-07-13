import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import {API_VERSION, BASE_URL} from '../shared';
import {Router} from '@angular/router';
import { LoopBackConfig, LoopBackAuth } from '../shared/sdk';
import { MemberService } from "app/services/member.service";
import { ROUTES } from '../sidebar/sidebar-routes.config';
declare var $: any;

@Component({
  selector: 'sv-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  location:Location;
  listTitle: any[];
  constructor(private memberApi:MemberService, private auth:LoopBackAuth, private router:Router, location:Location) {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
    this.location = location;
   }

  ngOnInit() {
    this.listTitle = ROUTES;
  }

  private lock():void {
    sessionStorage.removeItem('lockString');
    this.router.navigate(['lock']);
  }

  private logOut():void {
    
    this.memberApi.logOut().subscribe((rs:any) => {
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('lockString');
      this.router.navigate(['lock']);
    })
  }

  getTitle() {
    var title = this.location.prepareExternalUrl(this.location.path());
    if(title.charAt(0) === '#'){
        title = title.slice( 2 );
    }
    return this.listTitle.map(t => (title == t.path) ? t.title : '')
                         .filter(v => v !== '')[0];
  }
  passwordChange(change) {
    if (change) {
      $("#nav-changepassword").modal('hide');
    }
  }

}
