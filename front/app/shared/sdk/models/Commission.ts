/* tslint:disable */

declare var Object: any;
export interface CommissionInterface {
  type?: string;
  affiliateId?: string;
  value: number;
  commissionValue: number;
  purchaseDate?: Date;
  status?: string;
  memberIdPurshaser: string;
  productId: string;
  memberIdReferer?: string;
  memberIdExclusive?: string;
  created: Date;
  modified?: Date;
  id?: any;
}

export class Commission implements CommissionInterface {
  type: string;
  affiliateId: string;
  value: number;
  commissionValue: number;
  purchaseDate: Date;
  status: string;
  memberIdPurshaser: string;
  productId: string;
  memberIdReferer: string;
  memberIdExclusive: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: CommissionInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Commission`.
   */
  public static getModelName() {
    return "Commission";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Commission for dynamic purposes.
  **/
  public static factory(data: CommissionInterface): Commission{
    return new Commission(data);
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
      name: 'Commission',
      plural: 'Commissions',
      properties: {
        type: {
          name: 'type',
          type: 'string'
        },
        affiliateId: {
          name: 'affiliateId',
          type: 'string'
        },
        value: {
          name: 'value',
          type: 'number',
          default: 0
        },
        commissionValue: {
          name: 'commissionValue',
          type: 'number',
          default: 0
        },
        purchaseDate: {
          name: 'purchaseDate',
          type: 'Date'
        },
        status: {
          name: 'status',
          type: 'string'
        },
        memberIdPurshaser: {
          name: 'memberIdPurshaser',
          type: 'string'
        },
        productId: {
          name: 'productId',
          type: 'string'
        },
        memberIdReferer: {
          name: 'memberIdReferer',
          type: 'string'
        },
        memberIdExclusive: {
          name: 'memberIdExclusive',
          type: 'string'
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
