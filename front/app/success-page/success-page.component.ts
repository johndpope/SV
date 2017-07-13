import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL } from '../shared/base.url';
@Component({
  selector: 'app-success-page',
  templateUrl: './success-page.component.html',
  styleUrls: ['./success-page.component.css']
})
export class SuccessPageComponent implements OnInit {
  public msg: string = " FAILED: Invalid activate URL.";
  public className: string = "bg-success";
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
