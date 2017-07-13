import { Component, OnInit } from '@angular/core';
import {Router,ActivatedRoute} from '@angular/router';
import {LoopBackConfig,SettingApi} from '../shared/sdk/index';
import {ListMasterBaseComponent} from '../shared/listMaster.component';

import {NavbarComponent} from '../navbar/navbar.component';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent extends ListMasterBaseComponent {
  accessToken: string;
  constructor(public route:ActivatedRoute, public router:Router,public settingApi:SettingApi) {
      super();
      this.getAllSetting();
   }

  ngOnInit() {
    if(localStorage.getItem('accessToken') == null || sessionStorage.getItem('lockString') == null) {
      this.router.navigate(['lock'])
    } else {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }
  ngOnDestroy() {
    // this.sub.unsubscribe();
  }

}
