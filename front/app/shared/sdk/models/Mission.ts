/* tslint:disable */

declare var Object: any;
export interface MissionInterface {
  name: string;
  type: string;
  criteria: Array<any>;
  rewards?: number;
  powerUp?: Array<string>;
  id?: any;
}

export class Mission implements MissionInterface {
  name: string;
  type: string;
  criteria: Array<any>;
  rewards: number;
  powerUp: Array<string>;
  id: any;
  constructor(data?: MissionInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Mission`.
   */
  public static getModelName() {
    return "Mission";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Mission for dynamic purposes.
  **/
  public static factory(data: MissionInterface): Mission{
    return new Mission(data);
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
      name: 'Mission',
      plural: 'Missions',
      properties: {
        name: {
          name: 'name',
          type: 'string'
        },
        type: {
          name: 'type',
          type: 'string'
        },
        criteria: {
          name: 'criteria',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        rewards: {
          name: 'rewards',
          type: 'number',
          default: 0
        },
        powerUp: {
          name: 'powerUp',
          type: 'Array&lt;string&gt;'
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
