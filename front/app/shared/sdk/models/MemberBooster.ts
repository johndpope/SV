/* tslint:disable */

declare var Object: any;
export interface MemberBoosterInterface {
  memberId: any;
  boosterKey?: string;
  number?: number;
  id?: any;
  member?: any;
}

export class MemberBooster implements MemberBoosterInterface {
  memberId: any;
  boosterKey: string;
  number: number;
  id: any;
  member: any;
  constructor(data?: MemberBoosterInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `MemberBooster`.
   */
  public static getModelName() {
    return "MemberBooster";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of MemberBooster for dynamic purposes.
  **/
  public static factory(data: MemberBoosterInterface): MemberBooster{
    return new MemberBooster(data);
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
      name: 'MemberBooster',
      plural: 'MemberBoosters',
      properties: {
        memberId: {
          name: 'memberId',
          type: 'any'
        },
        boosterKey: {
          name: 'boosterKey',
          type: 'string',
          default: ''
        },
        number: {
          name: 'number',
          type: 'number',
          default: 0
        },
        id: {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
        member: {
          name: 'member',
          type: 'any',
          model: ''
        },
      }
    }
  }
}
