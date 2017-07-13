import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL } from '../shared/base.url';
@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css']
})
export class ErrorPageComponent implements OnInit {

  public msg: string = " FAILED: Invalid activate URL.";
  public className: string = "bg-danger";
  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    let me = this;
    this.route.queryParams.subscribe(params => {
      if (!params) {
        return;
      }
      this.msg = params["msg"];
    });
  }

}
