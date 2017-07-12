/* tslint:disable */

declare var Object: any;
export interface BoosterRequestInterface {
  from: string;
  to: string;
  boosterKey: string;
  status: string;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class BoosterRequest implements BoosterRequestInterface {
  from: string;
  to: string;
  boosterKey: string;
  status: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: BoosterRequestInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `BoosterRequest`.
   */
  public static getModelName() {
    return "BoosterRequest";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of BoosterRequest for dynamic purposes.
  **/
  public static factory(data: BoosterRequestInterface): BoosterRequest{
    return new BoosterRequest(data);
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
      name: 'BoosterRequest',
      plural: 'BoosterRequests',
      properties: {
        from: {
          name: 'from',
          type: 'string'
        },
        to: {
          name: 'to',
          type: 'string'
        },
        boosterKey: {
          name: 'boosterKey',
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
