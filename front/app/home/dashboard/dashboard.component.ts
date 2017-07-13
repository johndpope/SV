import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
declare var $: any;
@Component({
  selector: 'sv-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  accessToken: string;
  constructor(private router:Router) { }

  ngOnInit() {
    $('.navbar-brand').html("Dashboard");
  }

}
