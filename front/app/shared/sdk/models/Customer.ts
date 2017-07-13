/* tslint:disable */

declare var Object: any;
export interface CustomerInterface {
  customerId: string;
  customerPlayerId: string;
  customerType: string;
  customerStartsDate?: Date;
  customerCurrentStatus?: any;
  customerBrand?: string;
  customerProduct?: string;
  customerCellNumber?: number;
  quantity?: number;
  customer3dType?: string;
  customerMoodFactor?: number;
  customerProductsList?: Array<string>;
  customerProductsListSize?: number;
  id?: any;
}

export class Customer implements CustomerInterface {
  customerId: string;
  customerPlayerId: string;
  customerType: string;
  customerStartsDate: Date;
  customerCurrentStatus: any;
  customerBrand: string;
  customerProduct: string;
  customerCellNumber: number;
  quantity: number;
  customer3dType: string;
  customerMoodFactor: number;
  customerProductsList: Array<string>;
  customerProductsListSize: number;
  id: any;
  constructor(data?: CustomerInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Customer`.
   */
  public static getModelName() {
    return "Customer";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Customer for dynamic purposes.
  **/
  public static factory(data: CustomerInterface): Customer{
    return new Customer(data);
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
      name: 'Customer',
      plural: 'Customers',
      properties: {
        customerId: {
          name: 'customerId',
          type: 'string'
        },
        customerPlayerId: {
          name: 'customerPlayerId',
          type: 'string'
        },
        customerType: {
          name: 'customerType',
          type: 'string'
        },
        customerStartsDate: {
          name: 'customerStartsDate',
          type: 'Date',
          default: new Date(0)
        },
        customerCurrentStatus: {
          name: 'customerCurrentStatus',
          type: 'any'
        },
        customerBrand: {
          name: 'customerBrand',
          type: 'string'
        },
        customerProduct: {
          name: 'customerProduct',
          type: 'string'
        },
        customerCellNumber: {
          name: 'customerCellNumber',
          type: 'number'
        },
        quantity: {
          name: 'quantity',
          type: 'number'
        },
        customer3dType: {
          name: 'customer3dType',
          type: 'string'
        },
        customerMoodFactor: {
          name: 'customerMoodFactor',
          type: 'number'
        },
        customerProductsList: {
          name: 'customerProductsList',
          type: 'Array&lt;string&gt;'
        },
        customerProductsListSize: {
          name: 'customerProductsListSize',
          type: 'number'
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
