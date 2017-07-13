import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2AutoCompleteModule } from 'ng2-auto-complete';
import { MomentModule } from 'angular2-moment';
import { HomeRoutingModule } from './home.routing';
import { RlTagInputModule } from 'angular2-tag-input';
import { Daterangepicker } from 'ng2-daterangepicker';
import { FileDroppa } from 'file-droppa';
import { } from 'dropzone';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductComponent } from '../product/product.component';
import { ProductCreateComponent } from "app/product/create/product-create.component";
import { ProductDetailComponent } from "app/product/product-detail/product-detail.component";
import { ProductEditComponent } from "app/product/product-edit/product-edit.component";
import { VersionAppEditComponent } from "app/versionapp/versionapp-edit/versionapp-edit.component";
import { MidService } from '../services/mid.service';
import { BrandComponent } from "app/brand/brand.component";
import { BrandEditComponent } from "app/brand/brand-edit/brand-edit.component";
import { CashoutmoneyComponent } from '../cashoutmoney/cashoutmoney.component';
import { CommisioninjectionComponent } from '../commisioninjection/commisioninjection.component';
import { LeprechaunhistoryComponent } from '../leprechaunhistory/leprechaunhistory.component';
import { SafeboxComponent } from '../safebox/safebox.component';
import { MemberboosterComponent } from '../memberbooster/memberbooster.component';
import { BoosterrequestComponent } from '../boosterrequest/boosterrequest.component';
import { MemberComponent } from '../member/member.component';
import { MemberDetailComponent } from '../member/member-detail/member-detail.component';
import { MemberEditComponent } from '../member/member-edit/member-edit.component';
import { StoreComponent } from '../store/store.component';
import { StoreDetailComponent } from '../store/store-detail/store-detail.component';
import { YourProfileComponent } from '../your-profile/your-profile.component';
import { YourProfileEditComponent } from '../your-profile/your-profile-edit/your-profile-edit.component';
import { YourProfileChangepasswordComponent } from '../your-profile/your-profile-changepassword/your-profile-changepassword.component';

//Pipe
import { ToFixedPipe } from "app/pipes/price.pipe";
@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    MomentModule,
    FormsModule,
    ReactiveFormsModule,
    Ng2AutoCompleteModule,
    RlTagInputModule,
    Daterangepicker,
    FileDroppa
  ],
  declarations: [
    DashboardComponent,
    ProductComponent,
    ProductCreateComponent,
    ProductDetailComponent,
    ProductEditComponent,
    VersionAppEditComponent,
    ToFixedPipe,
    BrandComponent,
    BrandEditComponent,
    CashoutmoneyComponent,
    CommisioninjectionComponent,
    LeprechaunhistoryComponent,
    SafeboxComponent,
    MemberboosterComponent,
    BoosterrequestComponent,
    MemberComponent,
    MemberDetailComponent,
    MemberEditComponent,
    StoreComponent,
    StoreDetailComponent,
    YourProfileComponent,
    YourProfileEditComponent,
    YourProfileChangepasswordComponent
  ],
  providers: [MidService],
  exports:[YourProfileChangepasswordComponent]
})
export class HomeModule { }
