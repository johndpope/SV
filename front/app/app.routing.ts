import {Routes, RouterModule} from '@angular/router';
import { NgModule }             from '@angular/core';

import {HomeComponent} from './home/home.component';
import { ActivateAccountComponent } from './activate-account/activate-account.component';
import {LoginComponent} from './login/login.component';
import {LockscreenComponent} from './lockscreen/lockscreen.component';
const routes:Routes = [
    {path: '', component: HomeComponent},
    {path:'login', component: LoginComponent},
    {path: 'lock', component: LockscreenComponent},
    {path: 'activate-account', component: ActivateAccountComponent},
    {path: '**', redirectTo: '/'}
]

export const routing = RouterModule.forRoot(routes, {useHash: true});