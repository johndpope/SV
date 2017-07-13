import {Input, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms'
import {Router} from '@angular/router';
import {Md5} from 'ts-md5/dist/md5';

@Component({
  selector: 'app-lockscreen',
  templateUrl: './lockscreen.component.html',
  styleUrls: ['./lockscreen.component.css']
})
export class LockscreenComponent implements OnInit {
  private errorMsg:string;
  @Input() lockPassword: string;
  lockForm: FormGroup;
  constructor(private md5:Md5, private router:Router, private formBuilder: FormBuilder) {
    this.lockForm = formBuilder.group({
      lockPassword: ''
    })

    this.lockForm.valueChanges.subscribe(data => {
      this.errorMsg = null;
      if(typeof data.lockPassword !== 'undefined' && data.lockPassword == '') {       
        this.errorMsg = 'Please enter a password to unlock';
      }
    })
  }

  ngOnInit() {
    if(sessionStorage.getItem('lockString') == '1468ada3b23505492b8334352bd051b5') {
      this.router.navigate(['login']);
    }
  }


  lock():void {
    let pwd = this.lockPassword;
    if(typeof pwd == 'undefined' || pwd == '') {
      this.errorMsg = 'Please enter a password to unlock';
    } else {
      if(this.hashString(pwd) == '1468ada3b23505492b8334352bd051b5') {
        sessionStorage.setItem('lockString', this.hashString(pwd).toString());
        this.router.navigate(['login']);
      } else {
        this.errorMsg = "Password wrong !!!";
      }
    }
  }

  private hashString(pwd:string ): Int32Array | string {
    return Md5.hashStr(Md5.hashStr(Md5.hashStr(pwd).toString()).toString());
  }
}
