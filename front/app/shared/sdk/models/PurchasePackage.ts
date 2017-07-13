/* tslint:disable */

declare var Object: any;
export interface PurchasePackageInterface {
  name: string;
  description?: string;
  category?: string;
  items?: Array<any>;
  price?: number;
  priceUnit?: string;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class PurchasePackage implements PurchasePackageInterface {
  name: string;
  description: string;
  category: string;
  items: Array<any>;
  price: number;
  priceUnit: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: PurchasePackageInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `PurchasePackage`.
   */
  public static getModelName() {
    return "PurchasePackage";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of PurchasePackage for dynamic purposes.
  **/
  public static factory(data: PurchasePackageInterface): PurchasePackage{
    return new PurchasePackage(data);
  }  
  /**
  * @method getModelDefinition
  * @author Julien Ledun
  * @license MIT
  * This method returns an object that represents some of the model
  * definitions.
  **/
  public static getModelDefinition() {
    return {
      name: 'PurchasePackage',
      plural: 'PurchasePackages',
      properties: {
        name: {
          name: 'name',
          type: 'string'
        },
        description: {
          name: 'description',
          type: 'string'
        },
        category: {
          name: 'category',
          type: 'string'
        },
        items: {
          name: 'items',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        price: {
          name: 'price',
          type: 'number',
          default: 0
        },
        priceUnit: {
          name: 'priceUnit',
          type: 'string',
          default: `function () {
        return "USD";
  }`
        },
        created: {
          name: 'created',
          type: 'Date',
          default: new Date(0)
        },
        modified: {
          name: 'modified',
          type: 'Date',
          default: new Date(0)
        },
        id: {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
      }
    }
  }
}
