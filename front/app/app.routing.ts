import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { HomeComponent } from './home/home.component';
import { ActivateAccountComponent } from './activate-account/activate-account.component';
import { LoginComponent } from './login/login.component';
import { LockscreenComponent } from './lockscreen/lockscreen.component';
import { SuccessPageComponent } from './success-page/success-page.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { MemberConfirmpasswordrecoveryComponent } from './member/member-confirmpasswordrecovery/member-confirmpasswordrecovery.component';
const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'lock', component: LockscreenComponent },
    { path: 'activate-account', component: ActivateAccountComponent },
    { path: 'success', component: SuccessPageComponent },
    { path: 'error', component: ErrorPageComponent },
    { path: 'user-confirmpasswordrecovery/:user-id', component: MemberConfirmpasswordrecoveryComponent },
    { path: '**', redirectTo: '/' }
]

export const routing = RouterModule.forRoot(routes, { useHash: true });