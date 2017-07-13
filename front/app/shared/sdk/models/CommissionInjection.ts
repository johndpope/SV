/* tslint:disable */

declare var Object: any;
export interface CommissionInjectionInterface {
  amount: number;
  ownerId: string;
  status?: string;
  created: Date;
  modified?: Date;
  id?: any;
}

export class CommissionInjection implements CommissionInjectionInterface {
  amount: number;
  ownerId: string;
  status: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: CommissionInjectionInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `CommissionInjection`.
   */
  public static getModelName() {
    return "CommissionInjection";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of CommissionInjection for dynamic purposes.
  **/
  public static factory(data: CommissionInjectionInterface): CommissionInjection{
    return new CommissionInjection(data);
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
      name: 'CommissionInjection',
      plural: 'CommissionInjections',
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
        status: {
          name: 'status',
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
