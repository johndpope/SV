/* tslint:disable */

declare var Object: any;
export interface OrderInterface {
  transactionId: string;
  platform: string;
  memberId?: string;
  purchasePackageId?: string;
  purchasePackageLog?: any;
  price?: number;
  priceUnit?: string;
  status?: number;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Order implements OrderInterface {
  transactionId: string;
  platform: string;
  memberId: string;
  purchasePackageId: string;
  purchasePackageLog: any;
  price: number;
  priceUnit: string;
  status: number;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: OrderInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Order`.
   */
  public static getModelName() {
    return "Order";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Order for dynamic purposes.
  **/
  public static factory(data: OrderInterface): Order{
    return new Order(data);
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
      name: 'Order',
      plural: 'Orders',
      properties: {
        transactionId: {
          name: 'transactionId',
          type: 'string'
        },
        platform: {
          name: 'platform',
          type: 'string'
        },
        memberId: {
          name: 'memberId',
          type: 'string'
        },
        purchasePackageId: {
          name: 'purchasePackageId',
          type: 'string'
        },
        purchasePackageLog: {
          name: 'purchasePackageLog',
          type: 'any'
        },
        price: {
          name: 'price',
          type: 'number'
        },
        priceUnit: {
          name: 'priceUnit',
          type: 'string',
          default: `function () {
        return "USD";
  }`
        },
        status: {
          name: 'status',
          type: 'number',
          default: 0
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
