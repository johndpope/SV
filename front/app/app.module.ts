import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { SDKBrowserModule } from './shared/sdk/index';
import {Md5} from 'ts-md5/dist/md5';

import {HomeModule} from './home/home.module';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

// Routes
import { routing } from './app.routing';
import { HomeRoutingModule } from './home/home.routing';

import { ActivateAccountComponent } from './activate-account/activate-account.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { VersionAppComponent } from './versionapp/versionapp.component';
import { MemberService } from "app/services/member.service";
import { UploadService } from "app/services/upload.service";
import { LockscreenComponent } from './lockscreen/lockscreen.component';
import { MissionComponent } from "app/mission/mission.component";
import { MissionEditComponent } from "app/mission/mission-edit/mission-edit.component";
import { MissionCriteriaComponent } from "app/mission/mission-edit/mission-criteria/mission-criteria.component";
import { MissionPowerUpComponent } from "app/mission/mission-edit/mission-powerup/mission-powerup.component";
import { AssetComponent } from "app/asset/asset.component";
import { AssetEditComponent } from 'app/asset/asset-edit/asset-edit.component';
import { OrderComponent } from "app/order/order.component";
import { MissionDetailComponent } from "app/mission/mission-detail/mission-detail.component";
import { BrandCategorieComponent } from "app/brandcategorie/brandcategorie.component";
import { BrandCategorieDetailComponent } from "app/brandcategorie/brandcategorie-detail/brandcategorie-detail.component";
import { BrandCategorieEditComponent } from "app/brandcategorie/brandcategorie-edit/brandcategorie-edit.component";
import { BoosterComponent } from "app/booster/booster.component";
import { BoosterDetailComponent } from "app/booster/booster-detail/booster-detail.component";
import { BoosterEditComponent } from "app/booster/booster-edit/booster-edit.component";
import { PurchasePackageComponent } from "app/purchasepackage/purchasepackage.component";
import { PurchasePackageDetailComponent } from "app/purchasepackage/purchasepackage-detail/purchasepackage-detail.component";
import { PurchasePackageEditComponent } from "app/purchasepackage/purchasepackage-edit/purchasepackage-edit.component";
import { PurchasePackageItemsComponent } from "app/purchasepackage/purchasepackage-edit/purchasepackage-items/purchasepackage-items.component";
import { BrandDetailComponent } from "app/brand/brand-detail/brand-detail.component";
import { SettingComponent } from './setting/setting.component';
import { CashoutmoneyDetailComponent } from './cashoutmoney/cashoutmoney-detail/cashoutmoney-detail.component';



@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ActivateAccountComponent,
    HomeComponent,
    LoginComponent,
    VersionAppComponent,
    SidebarComponent,
    LockscreenComponent,
    MissionComponent,
    MissionEditComponent,
    MissionCriteriaComponent,
    MissionPowerUpComponent,
    AssetComponent,
    AssetEditComponent,
    OrderComponent,
    MissionDetailComponent,
    BrandCategorieComponent,
    BrandCategorieDetailComponent,
    BrandCategorieEditComponent,
    BoosterComponent,
    BoosterDetailComponent,
    BoosterEditComponent,
    PurchasePackageComponent,
    PurchasePackageDetailComponent,
    PurchasePackageEditComponent,
    PurchasePackageItemsComponent,
    BrandDetailComponent,
    SettingComponent,
    CashoutmoneyDetailComponent,
   
    
  ],
  imports: [
    HomeModule,
    BrowserModule,
    FormsModule, 
    ReactiveFormsModule, 
    HttpModule,
    routing,
    SDKBrowserModule.forRoot(),
    HomeRoutingModule,
  ],
  providers: [MemberService, Md5, UploadService],
  bootstrap: [AppComponent]
})
export class AppModule { }
