/* tslint:disable */
import { Injectable } from '@angular/core';
import { Email } from '../../models/Email';
import { Setting } from '../../models/Setting';
import { Member } from '../../models/Member';
import { Product } from '../../models/Product';
import { Brand } from '../../models/Brand';
import { BrandCategory } from '../../models/BrandCategory';
import { Stockroom } from '../../models/Stockroom';
import { Store } from '../../models/Store';
import { Staff } from '../../models/Staff';
import { MemberBooster } from '../../models/MemberBooster';
import { Upload } from '../../models/Upload';
import { Customer } from '../../models/Customer';
import { Booster } from '../../models/Booster';
import { VersionApp } from '../../models/VersionApp';
import { CashOutMoney } from '../../models/CashOutMoney';
import { CommissionInjection } from '../../models/CommissionInjection';
import { Safebox } from '../../models/Safebox';
import { Commission } from '../../models/Commission';
import { Mission } from '../../models/Mission';
import { PurchasePackage } from '../../models/PurchasePackage';
import { Order } from '../../models/Order';
import { BoosterRequest } from '../../models/BoosterRequest';
import { Asset } from '../../models/Asset';
import { LeprechaunHistory } from '../../models/LeprechaunHistory';

export interface Models { [name: string]: any }

@Injectable()
export class SDKModels {

  private models: Models = {
    Email: Email,
    Setting: Setting,
    Member: Member,
    Product: Product,
    Brand: Brand,
    BrandCategory: BrandCategory,
    Stockroom: Stockroom,
    Store: Store,
    Staff: Staff,
    MemberBooster: MemberBooster,
    Upload: Upload,
    Customer: Customer,
    Booster: Booster,
    VersionApp: VersionApp,
    CashOutMoney: CashOutMoney,
    CommissionInjection: CommissionInjection,
    Safebox: Safebox,
    Commission: Commission,
    Mission: Mission,
    PurchasePackage: PurchasePackage,
    Order: Order,
    BoosterRequest: BoosterRequest,
    Asset: Asset,
    LeprechaunHistory:LeprechaunHistory
    
  };

  public get(modelName: string): any {
    return this.models[modelName];
  }

  public getAll(): Models {
    return this.models;
  }

  public getModelNames(): string[] {
    return Object.keys(this.models);
  }
}
