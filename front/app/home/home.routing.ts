import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { ProductComponent } from '../product/product.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductCreateComponent } from "../product/create/product-create.component";
import { ProductDetailComponent } from "../product/product-detail/product-detail.component";
import { ProductEditComponent } from "app/product/product-edit/product-edit.component";
import { OrderComponent } from "app/order/order.component";
import { VersionAppComponent } from 'app/versionapp/versionapp.component';
import { VersionAppEditComponent } from 'app/versionapp/versionapp-edit/versionapp-edit.component';
import { MissionComponent } from 'app/mission/mission.component';
import { MissionEditComponent } from 'app/mission/mission-edit/mission-edit.component';
import { AssetComponent } from 'app/asset/asset.component';
import { AssetEditComponent } from 'app/asset/asset-edit/asset-edit.component';
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
import { BrandComponent } from "app/brand/brand.component";
import { BrandDetailComponent } from "app/brand/brand-detail/brand-detail.component";
import { BrandEditComponent } from "app/brand/brand-edit/brand-edit.component";
import { SettingComponent } from "app/setting/setting.component";
import { CashoutmoneyComponent } from '../cashoutmoney/cashoutmoney.component';
import { CashoutmoneyDetailComponent } from '../cashoutmoney/cashoutmoney-detail/cashoutmoney-detail.component';
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

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: HomeComponent,
                children: [
                    { path: '', component: DashboardComponent },
                    { path: 'products', component: ProductComponent },
                    { path: 'products/create', component: ProductCreateComponent },
                    { path: 'product-detail/:id', component: ProductDetailComponent },
                    { path: 'product-detail/:id/edit', component: ProductEditComponent },
                    { path: 'orders', component: OrderComponent },
                    { path: 'versionapps', component: VersionAppComponent },
                    { path: 'versionapps/page/:page', component: VersionAppComponent },
                    { path: 'versionapps/:id/edit', component: VersionAppEditComponent },
                    { path: 'versionapps/create', component: VersionAppEditComponent },
                    { path: 'missions', component: MissionComponent },
                    { path: 'missions/:id/edit', component: MissionEditComponent },
                    { path: 'missions/create', component: MissionEditComponent },
                    { path: 'assets', component: AssetComponent },
                    { path: 'assets/create', component: AssetEditComponent },
                    { path: 'assets/:id/edit', component: AssetEditComponent },
                    { path: 'missions/:id/detail', component: MissionDetailComponent },
                    { path: 'brandcate', component: BrandCategorieComponent },
                    { path: 'brandcate/:id/detail', component: BrandCategorieDetailComponent },
                    { path: 'brandcate/create', component: BrandCategorieEditComponent },
                    { path: 'brandcate/:id/edit', component: BrandCategorieEditComponent },
                    { path: 'booster', component: BoosterComponent },
                    { path: 'booster/:id/detail', component: BoosterDetailComponent },
                    { path: 'booster/:id/edit', component: BoosterEditComponent },
                    { path: 'purchasepackage', component: PurchasePackageComponent },
                    { path: 'purchasepackage/:id/detail', component: PurchasePackageDetailComponent },
                    { path: 'purchasepackage/create', component: PurchasePackageEditComponent },
                    { path: 'purchasepackage/:id/edit', component: PurchasePackageEditComponent },
                    { path: 'brand', component: BrandComponent },
                    { path: 'brand/:id/detail', component: BrandDetailComponent },
                    { path: 'brand/create', component: BrandEditComponent },
                    { path: 'brand/:id/edit', component: BrandEditComponent },
                    { path: 'setting', component: SettingComponent },
                    { path: 'cashoutmoney', component: CashoutmoneyComponent },
                    { path: 'cashoutmoney/:id/detail', component: CashoutmoneyDetailComponent },
                    { path: 'injection', component: CommisioninjectionComponent },
                    { path: 'leprechaunhistory', component: LeprechaunhistoryComponent },
                    { path: 'safebox', component: SafeboxComponent },
                    { path: 'memberbooster', component: MemberboosterComponent },
                    { path: 'boosterrequest', component: BoosterrequestComponent },
                    { path: 'member', component: MemberComponent },
                    { path: 'member/create', component: MemberEditComponent },
                    { path: 'member/:id', component: MemberDetailComponent },
                    { path: 'member/:id/edit', component: MemberEditComponent },
                    { path: 'store', component: StoreComponent },
                    { path: 'store/:id', component: StoreDetailComponent },

                ]
            }
        ])
    ],
    exports: [RouterModule]
})
export class HomeRoutingModule { }