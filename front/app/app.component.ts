import { Component } from '@angular/core';
import { LoopBackConfig } from './shared/sdk/index';
import {API_VERSION, BASE_URL} from './shared';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor() {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }
}
