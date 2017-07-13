/* tslint:disable */

declare var Object: any;
export interface CashOutMoneyInterface {
  amount: number;
  ownerId: string;
  email?: string;
  status?: string;
  data?: string;
  created: Date;
  modified?: Date;
  id?: any;
}

export class CashOutMoney implements CashOutMoneyInterface {
  amount: number;
  ownerId: string;
  email: string;
  status: string;
  data: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: CashOutMoneyInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `CashOutMoney`.
   */
  public static getModelName() {
    return "CashOutMoney";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of CashOutMoney for dynamic purposes.
  **/
  public static factory(data: CashOutMoneyInterface): CashOutMoney{
    return new CashOutMoney(data);
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
      name: 'CashOutMoney',
      plural: 'CashOutMoney',
      properties: {
        amount: {
          name: 'amount',
          type: 'number',
          default: 0
        },
        ownerId: {
          name: 'ownerId',
          type: 'string'
        },
        email: {
          name: 'email',
          type: 'string'
        },
        status: {
          name: 'status',
          type: 'string'
        },
        data: {
          name: 'data',
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
